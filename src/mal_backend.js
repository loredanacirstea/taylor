const mal = require('./mal/mal.js');
const malTypes = require('./mal/types.js');
const interop = require('./mal/interop');
const BN = require('bn.js');
const ethers = require('ethers');

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
    if (!data) data = [];
    else data = data.split(' ').map(val => val.trim());
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

modifyEnv('js-eval', async (orig_func, str) => {
    const utils = {
        BN: n => {
            if (typeof n === 'string' && n.substring(0, 2) === '0x') {
                return new BN(n.substring(2), 16)
            }
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
        range: (start, stop, step) => [...Array(stop + 1).keys()].slice(start, stop+1).filter((no, i) => i % step === 0),
        isArray,
        limited_pow: (a, b) => {
            // no floats yet
            if (b < 0) return 0;
            return utils.BN(a).pow(utils.BN(b));
        },
        ethcall: async (address, fsig, data) => {
            if (!mal.provider) return;
            return callContract(address, fsig, data, mal.provider)
        },
        ethsend: async (address, fsig, data) => {
            if (!mal.signer) return;
            return callContract(address, fsig, data, mal.signer, true).catch(console.log);
        }
    }
    
    let answ = await eval(str.toString());

    if (BN.isBN(answ)) answ = { _hex: '0x' + answ.toString(16) }
    if (typeof answ === 'boolean') answ = { _hex: toHex(answ ? 1 : 0)}

    return interop.js_to_mal(answ);
})

async function init() {

/* Taylor */

await mal.reps(`
(def! reduce (fn* (f xs init) (if (empty? xs) init (reduce f (rest xs) (f init (first xs)) ))))

(def! encode (fn* (a) (js-eval (str "utils.encode('" a "')") )))

(def! store! (fn* (key value) (js-eval (str "utils.store(" key ",'" value "')") )))

(def! sload (fn* (key type) (js-eval (str "utils.sload(" key ",'" type "')") )))

(def! array (fn* (& xs) xs ))

(def! array? (fn* (arr) (js-eval (str "utils.isArray" arr ) ) ))

(def! range (fn* (start stop step) (js-eval (str "utils.range(" start "," stop "," step ")" )) ))
`)

/* EVM */

await mal.reps(`
(def! add (fn* (a b) (js-eval (str "utils.BN(" a ").add(utils.BN(" b "))"))))

(def! sub (fn* (a b) (js-eval (str "utils.BN(" a ").sub(utils.BN(" b "))"))))

(def! mul (fn* (a b) (js-eval (str "utils.BN(" a ").mul(utils.BN(" b "))"))))

(def! div (fn* (a b) (js-eval (str "utils.BN(" a ").div(utils.BN(" b "))"))))

;sdiv

(def! mod (fn* (a b) (js-eval (str "utils.BN(" a ").mod(utils.BN(" b "))"))))

;smod

;(def! exp (fn* (a b) (js-eval (str "utils.BN(" a ").pow(utils.BN(" b "))"))))

(def! exp (fn* (a b) (js-eval (str "utils.limited_pow(" a "," b ")"))))

(def! lt (fn* (a b) (js-eval (str "utils.BN(" a ").lt(utils.BN(" b "))"))))

(def! gt (fn* (a b) (js-eval (str "utils.BN(" a ").gt(utils.BN(" b "))"))))

;sgt

;slt

(def! eq (fn* (a b) (js-eval (str "utils.BN(" a ").eq(utils.BN(" b "))"))))

(def! iszero (fn* (a) (js-eval (str "utils.BN(" a ").isZero()"))))

(def! not (fn* (a) (js-eval (str "utils.BN(" a ").notn(256)")) ) )

(def! and (fn* (a b) (js-eval (str "utils.BN(" a ").and(utils.BN(" b "))")) ) )

(def! or (fn* (a b) (js-eval (str "utils.BN(" a ").or(utils.BN(" b "))")) ) )

(def! xor (fn* (a b) (js-eval (str "utils.BN(" a ").xor(utils.BN(" b "))")) ) )

(def! byte (fn* (nth b) (js-eval (str "utils.BN(" b ").substring(2).substring(" nth "*2, " nth "*2 + 2)" )) ) )

(def! shl (fn* (a b) (js-eval (str "utils.BN(" b ").shln(" a ")")) ) )

(def! shr (fn* (a b) (js-eval (str "utils.BN(" b ").shrn(" a ")")) ) )

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

(def! eth-call (fn* (address fsig argList) (js-eval (str "utils.ethcall('" address "','" fsig "','" argList "')" )) ))

(def! eth-call! (fn* (address fsig argList) (js-eval (str "utils.ethsend('" address "','" fsig "','" argList "')" )) ))

`)

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

    mal.provider = provider;
    mal.signer = signer;
    return interpreter;
}

module.exports = mal;
