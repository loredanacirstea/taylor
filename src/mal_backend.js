const mal = require('./mal/mal.js');
const malTypes = require('./mal/types.js');
const interop = require('./mal/interop');
const BN = require('bn.js');
const ethers = require('ethers');
const bootstrap_functions = require('./bootstrap.js');

mal.re = str => mal.EVAL(mal.READ(str), mal.repl_env)
mal.reps = async lines => {
    lines = lines.split('\n\n')
    .map(line => line.replace('\n', ''))
    .filter(line => line.length > 4 && !line.includes(';'))
    let newl = [];
    for (let line of lines) {
        newl.push(await mal.rep(line));
    }
    return newl;
}

const modifyEnv = (name, func) => {
    const orig_func =  mal.repl_env.get(malTypes._symbol(name));
    mal.repl_env.set(malTypes._symbol(name), (...args) => {
        return func(orig_func, ...args);
    })
}
const toHex = bnval => {
    let hex = bnval.toString(16);
    if (hex.length % 2 === 1) hex = '0' + hex;
    return '0x' + hex;
}

const isArray = val => {
    try {
        val = JSON.parse(val);
    } catch(e) {};
    
    if (!(val instanceof Array)) return false;
    
    // TODO deep type check
    let itemtype = typeof val[0];
    return !val.some(it => (typeof it) !== itemtype);
}

const callContract = (address, fsig, data, providerOrSigner, isTx=false) => {
    data = callDataPrep(data);
    const signature = fsig.split('->').map(val => val.trim());
    const fname = signature[0].split('(')[0].trim();
    const abi = [
        `function ${signature[0]} ${isTx ? '' : 'view'} ${signature[1] ? 'returns ' + signature[1] : ''}`,
    ]
    const contract = new ethers.Contract(address, abi, providerOrSigner);
    return contract[fname](...data);
}

// TODO: better mal -> js parsing
const callDataPrep = data => {
    // data is a list: (4 6)
    data = data.substring(1, data.length-1).trim();
    if (!data) return [];

    // fixme: bad for strings with commas in them. do better
    try {
        data = JSON.parse(`[${ data.replace(/ /g, ',') }]`);
        data = data.map(val => typeof val !== 'string' ? val : val.replace(',', ' '));
    } catch (e) {
        console.log('callDataPrep', e);
    }

    return data;
}

mal.globalStorage = {};

modifyEnv('nil?', (orig_func, value) => {
    let nil = (
        (!value && value !== 0) ||
        (value instanceof Object && Object.keys(value).length === 0) ||
        (value instanceof Array && value.length === 0) ||
        (typeof value === 'string' && value.substring(0, 2) === '0x' && value.length === 2)
    );
    return interop.js_to_mal(nil ? true : false);
});

// modifyEnv('list?', (orig_func, value) => {
//     if (isArray(value)) return interop.js_to_mal(false);
//     return orig_func(value);
// });

const extensions = {};
const native_extensions = {
    BN: n => {
        if (typeof n === 'string' && n.substring(0, 2) === '0x') {
            return new BN(n.substring(2), 16)
        }
        if (BN.isBN(n)) return n;
        return new BN(n)
    },
    keccak256: n => {
        if (typeof n !== 'string') throw new Error('keccak256 expects string');

        // TODO: better encoding
        // in case we have keccak256 "0x.." "0x .."
        n = n.replace(/0x/g, '');

        if (n.substring(0, 2) !== '0x') n = '0x' + n;
        return ethers.utils.keccak256(ethers.utils.arrayify(n));
    },
    encode: n => {
        // TODO: proper encoding
        try {
            n = JSON.parse(n)
        } catch(e) {}

        switch (typeof n) {
            case 'number':
                return n.toString(16).padStart(8, '0');
            case 'string':
                return n;
        }
    },
    store: (key, value) => {
        mal.globalStorage[key] = value;
    },
    sload: (key, typename) => {
        let value = mal.globalStorage[key];
        // TODO: proper typecheck
        
        try {
            value = JSON.parse(value)
        } catch(e) {}

        return value;
    },
    range: (start, stop, step) => {
        start = BN.isBN(start) ? start.toNumber() : start;
        stop = BN.isBN(stop) ? stop.toNumber() : stop;
        step = BN.isBN(step) ? step.toNumber() : step;
        return [...Array(stop + 1).keys()].slice(start, stop+1).filter((no, i) => i % step === 0);
    },
    isArray,
    limited_pow: (a, b) => {
        // no floats yet
        if (b < 0) return 0;
        return native_extensions.BN(a).pow(native_extensions.BN(b));
    },
    ethcall: async (address, fsig, data) => {
        if (!mal.provider) return;
        return callContract(address, fsig, data, mal.provider)
    },
    ethsend: async (address, fsig, data) => {
        if (!mal.signer) return;
        const response = await callContract(address, fsig, data, mal.signer, true).catch(console.log);
        const receipt = await response.wait();
        console.log('receipt', receipt);
        return receipt;
    },
    listToJsArray: liststr => {
        // ! always expects a resolved list
        liststr = liststr.replace(/(?<!(BN))\(/g, '(list ');
        liststr = liststr.replace(/nil/g, 'Nil');
        return mal.re(liststr);
    },
    listToJsArrayStr: async liststr => {
        const jsequiv = await native_extensions.listToJsArray(liststr);
        return JSON.stringify(jsequiv);
    },
    listToJsArrayLength: async liststr => {
        const jsequiv = await native_extensions.listToJsArray(liststr);
        return jsequiv.length;
    }
}

mal.repl_env.set(malTypes._symbol('utils'), native_extensions);

const jsEvalParseBN = answ => {
    if (BN.isBN(answ)) answ = { _hex: '0x' + answ.toString(16) }
    if (typeof answ === 'boolean') answ = { _hex: toHex(answ ? 1 : 0)}

    if (answ && typeof answ === 'object') {
        if (answ instanceof Array) {
            return answ.map(val => jsEvalParseBN(val));
        }
        const newobj = {};
        Object.keys(answ).forEach(key => {
            newobj[key] = jsEvalParseBN(answ[key]);
        });
        return newobj;
    }

    return answ;
}

modifyEnv('js-eval', async (orig_func, str) => {
    const utils = Object.assign({}, native_extensions, extensions);
    let answ;

    try {
        answ = await eval(str.toString());
    } catch(e) {
        console.log(e);
        answ = undefined;
    }

    answ = jsEvalParseBN(answ);
    return interop.js_to_mal(answ);
})

async function init() {

/* Taylor */

// Nil can be null for now, but it should follow the on-chain version when js backend will be typed
await mal.reps(`
(def! Nil (js-eval (str "null")) )

(def! reduce (fn* (f xs init) (if (empty? xs) init (reduce f (rest xs) (f init (first xs)) ))))

(def! encode (fn* (a) (js-eval (str "utils.encode('" a "')") )))

(def! store! (fn* (key value) (js-eval (str "utils.store(" key ",'" value "')") )))

(def! sload (fn* (key type) (js-eval (str "utils.sload(" key ",'" type "')") )))

(def! array vector)

(def! array? (fn* (a) (vector? a) ))

(def! range (fn* (start stop step) (js-eval (str "utils.range(" start "," stop "," step ")" )) ))

(def! push (fn* (arr value)
    (conj arr value)
))

(def! shift (fn* (arr value)
    (cons value arr)
))

(def! length (fn* (val)
    (if (sequential? val)
        (js-eval (str
            "utils.listToJsArrayLength('"
                (pr-str val)
            "')"
        ))
        (let* (
                strval (pr-str val)
            )
            (js-eval (str
                strval
                ".slice(0, 2) === '0x' ? "
                strval
                ".substring(2).length / 2 : "
                strval
                ".length / 2"
            ))
        )
    )
))
`)

/* EVM */

await mal.reps(`
(def! add (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").add(utils.BN(" (pr-str b) "))"))))

(def! sub (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").sub(utils.BN(" (pr-str b) "))"))))

(def! mul (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").mul(utils.BN(" (pr-str b) "))"))))

(def! div (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").div(utils.BN(" (pr-str b) "))"))))

;sdiv

(def! mod (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").mod(utils.BN(" (pr-str b) "))"))))

;smod

;(def! exp (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").pow(utils.BN(" (pr-str b) "))"))))

(def! exp (fn* (a b) (js-eval (str "utils.limited_pow(" (pr-str a) "," (pr-str b) ")"))))

(def! lt (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").lt(utils.BN(" (pr-str b) "))"))))

(def! gt (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").gt(utils.BN(" (pr-str b) "))"))))

;sgt

;slt

(def! eq (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").eq(utils.BN(" (pr-str b) "))"))))

(def! iszero (fn* (a) (js-eval (str "utils.BN(" (pr-str a) ").isZero()"))))

(def! not (fn* (a) (js-eval (str "utils.BN(" (pr-str a) ").notn(256)")) ) )

(def! and (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").and(utils.BN(" (pr-str b) "))")) ) )

(def! or (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").or(utils.BN(" (pr-str b) "))")) ) )

(def! xor (fn* (a b) (js-eval (str "utils.BN(" (pr-str a) ").xor(utils.BN(" (pr-str b) "))")) ) )

(def! byte (fn* (nth b) (js-eval (str "utils.BN(" (pr-str b) ").substring(2).substring(" nth "*2, " nth "*2 + 2)" )) ) )

(def! shl (fn* (a b) (js-eval (str "utils.BN(" (pr-str b) ").shln(" a ")")) ) )

(def! shr (fn* (a b) (js-eval (str "utils.BN(" (pr-str b) ").shrn(" a ")")) ) )

`)

await mal.reps(`
(def! balances {})

(def! gas (fn* () (get cenv "gas")))

(def! address (fn* () (get cenv "address")))

(def! balance (fn* (addr) (get balances addr)))

(def! selfbalance (fn* () (get balances (address))))

(def! caller (fn* (address) (get cenv "caller" )))

(def! callvalue (fn* (address) (get cenv "callvalue" )))

(def! calldatasize (fn* () 4))

(def! codesize (fn* () 134 ))

(def! extcodesize (fn* (address) 134 ))

(def! returndatasize (fn* () 134 ))

(def! extcodehash (fn* () 1343322 ))

(def! chainid (fn* () (get cenv "chainid" )))

(def! origin (fn* () (get cenv "origin" )))

(def! gasprice (fn* () (get cenv "gasPrice" )))

(def! blockhash (fn* () (get cenv "blockhash" )))

(def! coinbase (fn* () (get cenv "coinbase" )))

(def! timestamp (fn* (a b) (js-eval "new Date().getTime()") ) )

(def! number (fn* () (get cenv "number" )))

(def! difficulty (fn* () (get cenv "difficulty" )))

(def! gaslimit (fn* () (get cenv "gasLimit" )))

(def! keccak256 (fn* (& xs) (js-eval (str "utils.keccak256('" (reduce str (map encode xs) "" ) "')") )))

(def! revert (fn* (a) (throw a) ) )

(def! return (fn* (a) a ))

(def! eth-call (fn* (address fsig argList) (js-eval (str "utils.ethcall('" address "','" fsig "','" (pr-str argList) "')" )) ))

(def! eth-call! (fn* (address fsig argList) (js-eval (str "utils.ethsend('" address "','" fsig "','" (pr-str argList) "')" )) ))

`)

/*  */

await mal.reps(Object.values(bootstrap_functions).join('\n\n'));


/* EVM */

// addmod
// mulmod
// signextend
// calldataload
// calldatacopy
// codecopy
// extcodecopy
// create
// create2
// call
// callcode
// delegatecall
// staticcall
// logs
}

const DEFAULT_TXOBJ = {
    gasLimit: 1000000,
    value: 0,
    gasPrice: 10
}

const underNumberLimit = bnval => bnval.abs().lt(new BN(2).pow(new BN(16)));

mal.getBackend = async (address, provider, signer) => {
    address = address || '0x81bD2984bE297E18F310BAef6b895ea089484968';
    const dec = async bnval => {
        if (bnval instanceof Promise) bnval = await bnval;
        if(!bnval) return bnval;
        
        if (typeof bnval === 'number') {
            bnval = new BN(bnval);
        } else if (typeof bnval === 'object' && bnval._hex) {
            bnval = new BN(bnval._hex.substring(2), 16);
        } else if (bnval instanceof Array) {
            let vals = []
            for (let val of bnval) {
                vals.push(await dec(val));
            }
            return vals;
        }
        
        if (BN.isBN(bnval)) {
            return underNumberLimit(bnval) ? bnval.toNumber() : bnval;
        }
        return bnval;
    }
  
    const from = signer ? await signer.getAddress() : '0xfCbCE2e4d0E19642d3a2412D84088F24bFB33a48';
    const chainid = provider ? (await provider.getNetwork()).chainId : 3;

    await init();
  
    const interpreter = {
      address,
      call: async (mal_expression, txObj) => {
        mal_expression = mal_expression.replace(/_/g, '');
        txObj = Object.assign({ from }, DEFAULT_TXOBJ, txObj);
  
        await mal.rep(`(def! cenv {
          "gas" 176000
          "gasLimit" ${txObj.gasLimit}
          "address" (str "${address}")
          "callvalue" (js-eval "utils.BN(${txObj.value})")
          "gasPrice" (js-eval "utils.BN(${txObj.gasPrice})")
          "caller" (str "${txObj.from}")
          "number" (js-eval "utils.BN(3)")
          "coinbase" (str "0x0000000000000000000000000000000000000000")
          "blockhash" (str "0x37b89115ab3653201f2f995d2d0c50cb99b65251f530ed496470b9102e035d5f")
          "origin" (str "${txObj.from}")
          "difficulty" (js-eval "utils.BN(300)")
          "chainid" ${chainid}
        })`);

        const answ = await mal.re(mal_expression);
        return dec(answ);
      },
      provider,
      signer: signer || { getAddress: () => from },
    }
    interpreter.send = interpreter.call;
    interpreter.sendAndWait = interpreter.send;
    interpreter.extend = expression => mal.rep(expression);
    interpreter.jsextend = (name, callb) => {
        const utilname = name.replace(/-/g, '_');
        extensions[utilname] = callb;
        mal.rep(`(def! ${name} (fn* (& xs)
            (js-eval (str 
                "utils.${utilname}(" 
                    (js-eval (str
                        "utils.listToJsArrayStr('"
                            (pr-str xs)
                        "')"
                    ))
                ")"
            )) 
        ))`)
    }
    // needed for ethcall
    mal.provider = provider;
    mal.signer = signer;
    return interpreter;
}

module.exports = mal;
