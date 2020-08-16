const mal = require('./mal/mal.js');
const malTypes = require('./mal/types.js');
const interop = require('./mal/interop');
const BN = require('bn.js');
const ethers = require('ethers');
const bootstrap_functions = require('./bootstrap.js');
const { strip0x } = require('./utils.js');
require('./extensions.js');

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

const ethShortAbiToHuman = (fsig, isTx) => {
    if (typeof isTx === 'undefined') isTx = !(fsig.includes('->'));
    const fname = fsig.split('(')[0].trim();
    let abi = fsig;

    if (fsig.includes('->')) {
        let replacement = !fsig.includes('public') && !fsig.includes('external') ? ' public' : '';
        replacement += !fsig.includes('pure') && !fsig.includes('view') ? ' view' : '';
        abi = fsig.replace('->', replacement + ' returns');
    }
    if (!abi.includes('public') && !abi.includes('external')) {
        abi += ' public';
    }
    abi = 'function ' + abi;
    return {
        abi,
        name: fname,
    }
}

const ethHumanAbiToJson = fsig => {
    const interf = new ethers.utils.Interface([fsig]);
    return JSON.parse(interf.format('json'))[0];
}

const ethSig = (fabi) => {
    const interf = new ethers.utils.Interface([fabi]);
    return interf.getSighash(fabi.name);
}

const SLOT_SIZE_MULTI = {
    tuple: true,
    string: true,
    bytes: true,
}

const ethSlotSize = (ttype) => {
    if (SLOT_SIZE_MULTI[ttype]) return false;
    if (ttype.slice(-1) === ']') return false;
    return true;
}

const callContract = (address, fsig, data, providerOrSigner, isTx=false, ethvalue=0) => {
    const {abi, name} = ethShortAbiToHuman(fsig, isTx);
    const contract = new ethers.Contract(address, [abi], providerOrSigner);
    return contract[name](...data, {value: ethvalue});
}

mal.globalStorage = {};
mal.runtimeMemory = {};
mal.freeMemPtr = 192;
mal.allocate = size => {
    const ptr = mal.freeMemPtr;
    mal.freeMemPtr += size;
    return ptr;
}

modifyEnv('nil?', (orig_func, value) => {
    let nil = (
        (!value && value !== 0) ||
        (value instanceof Object && Object.keys(value).length === 0) ||
        (value instanceof Array && value.length === 0) ||
        (typeof value === 'string' && value.substring(0, 2) === '0x' && value.length === 2)
    );
    return interop.js_to_mal(nil ? true : false);
});

const extensions = {};
const native_extensions = {
    BN: n => {
        if (typeof n === 'string' && n.substring(0, 2) === '0x') {
            return new BN(n.substring(2), 16);
        }
        if (BN.isBN(n)) return n;
        if (typeof n === 'object' && n._hex) return new BN(n._hex.substring(2), 16);
        return new BN(n);
    },
    keccak256: n => {
        // console.log('keccak256', n, typeof n)
        if (n instanceof Array) n = mal.runtimeMemory[n[0]];
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

        if (n instanceof Array && n[2] === 'ptr') n = native_extensions.mload(n[0]);

        switch (typeof n) {
            case 'number':
                // return n.toString(16).padStart(8, '0');
                return n.toString(16).padStart(64, '0');
            case 'string':
                return n;
        }
    },
    store: (key, value) => {
        mal.globalStorage[key] = value;
        return key;
    },
    sload: (key, typename) => {
        let value = mal.globalStorage[key];
        // TODO: proper typecheck

        try {
            value = JSON.parse(value)
        } catch(e) {}

        return value;
    },
    mstore: (value) => {
        const length = value.toString().length;
        const key = mal.allocate(length);
        mal.runtimeMemory[key] = value;
        // console.log('--mstore', key, length, mal.runtimeMemory[key], typeof value);
        return [key, length, 'ptr'];
    },
    mload: (key) => {
        let value = mal.runtimeMemory[key] || 0;
        // TODO: proper typecheck

        try {
            value = JSON.parse(value)
        } catch(e) {}

        return value;
    },
    range: (start, stop, step) => {
        start = native_extensions.BN(start).toNumber();
        stop = native_extensions.BN(stop).toNumber();
        step = native_extensions.BN(step).toNumber();
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
    ethsend: async (address, fsig, data, ethvalue) => {
        if (!mal.signer) return;
        if (!ethvalue) ethvalue = 0;
        ethvalue = new BN(ethvalue, 10);

        const response = await callContract(address, fsig, data, mal.signer, true, ethvalue).catch(console.log);
        const receipt = await response.wait();
        console.log('receipt', receipt);
        return receipt;
    },
    listToJsArray: liststr => {
        // ! always expects a resolved list
        liststr = liststr.replace(/(?<!(BN))\(/g, '(list ');
        return mal.re(liststr);
    },
    listToJsArrayStr: async liststr => {
        const jsequiv = await native_extensions.listToJsArray(liststr);
        return JSON.stringify(jsequiv);
    },
    listToJsArrayLength: async liststr => {
        const jsequiv = await native_extensions.listToJsArray(liststr);
        return jsequiv.length;
    },
    jsStr: async val => {
        if (typeof val !== 'string') {
            val = JSON.stringify(val);
        }
        return await native_extensions.listToJsArrayStr(val);
    },
    join: (a, b) => {
        if (typeof a !== 'string' || typeof b !== 'string') throw new Error('join argument is not string');
        const toHex = arg => arg.slice(0, 2) === '0x' ? arg : '0x' + arg.hexEncode();

        return toHex(a) + strip0x(toHex(b));
    },
    return_d: a => {
        // console.log('return_d', a);
        if (a instanceof Array) return mal.runtimeMemory[a[0]] || 0;
        return a;
    },
    ethabi_encode: (types, values) => {
        if (!(types instanceof Array)) types = [types];
        if (!(values instanceof Array)) values = [values];
        return ethers.utils.defaultAbiCoder.encode(types, values);
    },
    ethabi_decode: (types, data) => {
        const isarr = types instanceof Array;
        if (!isarr) types = [types];
        if (data instanceof Array) data = data[0];
        const values = ethers.utils.defaultAbiCoder.decode(types, data);
        if (isarr) return values;
        return values[0];
    },
    wasmcall: async (url, fname, args) => {
        const wmodule = await WebAssembly.instantiateStreaming(fetch(url), {});
        return wmodule.instance.exports[fname](...args);
    }
}

mal.repl_env.set(malTypes._symbol('utils'), native_extensions);

const toTayBN = hexval => { return {_hex: hexval, _isBigNumber: {_hex: '0x01'}} };

const jsEvalParseBN = answ => {
    if (BN.isBN(answ)) answ = toTayBN('0x' + answ.toString(16));
    if (typeof answ === 'boolean') answ = toTayBN(toHex(answ ? 1 : 0))

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
    const nil = null;
    let answ;

    try {
        answ = await eval(str.toString());
    } catch(e) {
        console.log(`Expression: ${str}  ;;`, e);
        answ = undefined;
    }

    // console.log('--js-eval', str, answ, typeof answ);

    answ = jsEvalParseBN(answ);
    // console.log('js-eval', answ, typeof answ);
    return interop.js_to_mal(answ);
})

async function init() {

/* Taylor */

await mal.rep('(def! js-str (fn* (val) (js-eval (str "utils.jsStr(`" (pr-str val) "`)" )) ))');

await mal.reps(`

(def! reduce (fn* (f xs init) (if (empty? xs) init (reduce f (rest xs) (f init (first xs)) ))))

(def! encode (fn* (a) (js-eval (str "utils.encode(" (js-str a) ")") )))

(def! store! (fn* (key value) (js-eval (str "utils.store(" key "," (js-str value) ")") )))

(def! sload (fn* (key type) (js-eval (str "utils.sload(" key ",'" type "')") )))

(def! mstore (fn* (value) (js-eval (str "utils.mstore(" (js-str value) ")") )))

(def! mload (fn* (t2ptr) (js-eval (str "utils.mload(" t2ptr ")") )))

(def! array vector)

(def! array? (fn* (a) (vector? a) ))

(def! range (fn* (start stop step) (js-eval (str "utils.range(" (js-str start) "," (js-str stop) "," (js-str step) ")" )) ))

(def! push (fn* (arr value)
    (conj arr value)
))

(def! shift (fn* (arr value)
    (cons value arr)
))

(def! join (fn* (a b) (js-eval (str "utils.join(" (js-str a) "," (js-str b) ")") ) ))

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
(def! add (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").add(utils.BN(" (js-str b) "))"))))

(def! sub (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").sub(utils.BN(" (js-str b) "))"))))

(def! mul (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").mul(utils.BN(" (js-str b) "))"))))

(def! div (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").div(utils.BN(" (js-str b) "))"))))

;sdiv

(def! mod (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").mod(utils.BN(" (js-str b) "))"))))

;smod

;(def! exp (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").pow(utils.BN(" (js-str b) "))"))))

(def! exp (fn* (a b) (js-eval (str "utils.limited_pow(" (js-str a) "," (js-str b) ")"))))

(def! lt (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").lt(utils.BN(" (js-str b) "))"))))

(def! gt (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").gt(utils.BN(" (js-str b) "))"))))

;sgt

;slt

(def! eq (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").eq(utils.BN(" (js-str b) "))"))))

(def! iszero (fn* (a) (js-eval (str "utils.BN(" (js-str a) ").isZero()"))))

(def! not (fn* (a) (js-eval (str "utils.BN(" (js-str a) ").notn(256)")) ) )

(def! and (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").and(utils.BN(" (js-str b) "))")) ) )

(def! or (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").or(utils.BN(" (js-str b) "))")) ) )

(def! xor (fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").xor(utils.BN(" (js-str b) "))")) ) )

(def! byte (fn* (nth b) (js-eval (str "utils.BN(" (js-str b) ").substring(2).substring(" nth "*2, " nth "*2 + 2)" )) ) )

(def! shl (fn* (a b) (js-eval (str "utils.BN(" (js-str b) ").shln(" a ")")) ) )

(def! shr (fn* (a b) (js-eval (str "utils.BN(" (js-str b) ").shrn(" a ")")) ) )

`)

await mal.reps(`
(def! t2 (fn* (a b) (list a b "ptr") ))

(def! t12 (fn* (a) (first a) ))

(def! t21 (fn* (a) (nth a 1) ))

(def! msize (fn* () 256 ))

`)

await mal.reps(`
(def! balances {})

(def! gas (fn* () (get cenv "gas")))

(def! address (fn* () (get cenv "address")))

(def! balance (fn* (addr) (get balances addr)))

(def! selfbalance (fn* () (get balances (address))))

(def! caller (fn* (address) (get cenv "caller" )))

(def! callvalue (fn* (address) (get cenv "callvalue" )))

(def! calldatasize (fn* () 8))

(def! codesize (fn* () 22200 ))

(def! extcodesize (fn* (address) 0 ))

(def! returndatasize (fn* () 0 ))

(def! extcodehash (fn* (address) 0 ))

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

(def! return# (fn* (a) (js-eval (str "utils.return_d(" (js-str a) ")" )) ))

(def! eth-call (fn* (address fsig argList) (js-eval (str "utils.ethcall('" address "','" fsig "'," (js-str argList) ")" )) ))

(def! eth-call! (fn* (address fsig argList ethvalue) (js-eval (str "utils.ethsend('" address "','" fsig "'," (js-str argList) "," (js-str ethvalue)  ")" )) ))

(def! eth-abi-encode (fn* (types values) (js-eval (str "utils.ethabi_encode(" (js-str types) "," (js-str values) ")" )) ))

(def! eth-abi-decode (fn* (types values) (js-eval (str "utils.ethabi_decode(" (js-str types) "," (js-str values) ")" )) ))

(def! wasm-call (fn* (url fname args) (js-eval (str "utils.wasmcall(" (js-str url) "," (js-str fname) "," (js-str args) ")" )) ))

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
    interpreter.extend = async expression => {
        await mal.rep(expression);
        interpreter.functions = interpreter.getFns();
    }
    interpreter.jsextend = (name, callb) => {
        const utilname = name.replace(/-/g, '_').replace(/!/g, '_bang');
        extensions[utilname] = callb;
        return interpreter.extend(`(def! ${name} (fn* (& xs)
            (js-eval (str
                "utils.${utilname}("
                    (js-str xs)
                ")"
            ))
        ))`)
    }
    interpreter.getFns = () => {
        return mal.repl_env.data;
    }
    interpreter.functions = interpreter.getFns();
    // needed for ethcall
    mal.provider = provider;
    mal.signer = signer;
    mal.utils = {
        ethShortAbiToHuman,
        ethHumanAbiToJson,
        ethSig,
        ethSlotSize,
    }
    return interpreter;
}

module.exports = mal;
