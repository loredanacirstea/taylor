const mal = require('./mal/mal.js');
const malTypes = require('./mal/types.js');
const interop = require('./mal/interop');
const BN = require('bn.js');
const ethers = require('ethers');

mal.re = str => mal.EVAL(mal.READ(str), mal.repl_env)
mal.reps = lines => lines.split('\n\n')
    .map(line => line.replace('\n', ''))
    .filter(line => line.length > 4 && !line.includes(';'))
    .map(line => mal.rep(line));

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
mal.globalStorage = {};

modifyEnv('js-eval', (orig_func, str) => {
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
        }
    }
    let answ = eval(str.toString());

    if (BN.isBN(answ)) answ = { _hex: toHex(answ) }
    if (typeof answ === 'boolean') answ = { _hex: toHex(answ ? 1 : 0)}

    return interop.js_to_mal(answ);
})

/* Taylor */

mal.reps(`
(def! reduce (fn* (f xs init) (if (empty? xs) init (reduce f (rest xs) (f init (first xs)) ))))

(def! encode (fn* (a) (js-eval (str "utils.encode('" a "')") )))

(def! store! (fn* (key value) (js-eval (str "utils.store(" key ",'" value "')") )))

(def! sload (fn* (key type) (js-eval (str "utils.sload(" key ",'" type "')") )))
`)

/* EVM */

mal.reps(`
(def! add (fn* (a b) (js-eval (str "utils.BN(" a ").add(utils.BN(" b "))"))))

(def! sub (fn* (a b) (js-eval (str "utils.BN(" a ").sub(utils.BN(" b "))"))))

(def! mul (fn* (a b) (js-eval (str "utils.BN(" a ").mul(utils.BN(" b "))"))))

(def! div (fn* (a b) (js-eval (str "utils.BN(" a ").div(utils.BN(" b "))"))))

;sdiv

(def! mod (fn* (a b) (js-eval (str "utils.BN(" a ").mod(utils.BN(" b "))"))))

;smod

(def! exp (fn* (a b) (js-eval (str "utils.BN(" a ").pow(utils.BN(" b "))"))))

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

mal.reps(`
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

(def! return (fn* (a) (js-eval (str "'" a "'" )) ) )

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

const DEFAULT_TXOBJ = {
    gasLimit: 1000000,
    value: 0,
    gasPrice: 10
}

mal.getBackend = (address) => {
    address = address || '0x81bD2984bE297E18F310BAef6b895ea089484968';
    const dec = bnval => {
        if(!bnval) return bnval;
        if (typeof bnval === 'number') {
            bnval = new BN(bnval);
        } else if (typeof bnval === 'object' && bnval._hex) {
            bnval = new BN(bnval._hex.substring(2), 16);
        } else if (bnval instanceof Array) {
            return bnval.map(val => dec(val));
        }
        
        if (BN.isBN(bnval)) {
            return bnval.lt(new BN(2).pow(new BN(16))) ? bnval.toNumber() : bnval;
        }
        return bnval;
    }
  
    const from = '0xfCbCE2e4d0E19642d3a2412D84088F24bFB33a48';
  
    const interpreter = {
      address,
      call: (mal_expression, txObj) => {
        mal_expression = mal_expression.replace(/_/g, '');
        txObj = Object.assign({ from }, DEFAULT_TXOBJ, txObj);
  
        mal.rep(`(def! cenv {
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
          "chainid" 3
        })`);
  
        return dec(mal.re(mal_expression));
      },
      signer: { _address: from },
    }
    interpreter.send = interpreter.call;
    interpreter.sendAndWait = interpreter.send;
    return interpreter;
}

module.exports = mal;
