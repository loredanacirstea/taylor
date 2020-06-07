const mal = require('../src/mal/mal.js');
const malTypes = require('../src/mal/types.js');
const interop = require('../src/mal/interop');
const BN = require('bn.js');

mal.re = str => mal.EVAL(mal.READ(str), mal.repl_env)

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

modifyEnv('js-eval', (orig_func, str) => {
    // console.log('js-eval', str);
    const utils = {
        BN: n => {
            if (typeof n === 'string' && n.substring(0, 2) === '0x') {
                return new BN(n.substring(2), 16)
            }
            return new BN(n)
        }
    }
    let answ = eval(str.toString());

    if (BN.isBN(answ)) answ = { _hex: toHex(answ) }
    if (typeof answ === 'boolean') answ = { _hex: toHex(answ ? 1 : 0)}

    return interop.js_to_mal(answ);
})

/* EVM */

mal.rep('(def! add (fn* (a b) (js-eval (str a ".add(" b ")"))))')
mal.rep('(def! sub (fn* (a b) (js-eval (str a ".sub(" b ")"))))')
mal.rep('(def! mul (fn* (a b) (js-eval (str a ".mul(" b ")"))))')
mal.rep('(def! div (fn* (a b) (js-eval (str a ".div(" b ")"))))')
// sdiv
mal.rep('(def! mod (fn* (a b) (js-eval (str a ".mod(" b ")"))))')
// smod
// exp
mal.rep('(def! exp (fn* (a b) (js-eval (str a ".pow(" b ")"))))')
mal.rep('(def! lt (fn* (a b) (js-eval (str a ".lt(" b ")"))))')
mal.rep('(def! gt (fn* (a b) (js-eval (str a ".gt(" b ")"))))')
// sgt
// slt
mal.rep('(def! eq (fn* (a b) (js-eval (str a ".eq(" b ")"))))')
mal.rep('(def! iszero (fn* (a) (js-eval (str a ".isZero()"))))')
mal.rep('(def! not (fn* (a) (js-eval (str a ".notn(256)")) ) )')
mal.rep('(def! and (fn* (a b) (js-eval (str a ".and(" b ")")) ) )')
mal.rep('(def! or (fn* (a b) (js-eval (str a ".or(" b ")")) ) )')
mal.rep('(def! xor (fn* (a b) (js-eval (str a ".xor(" b ")")) ) )')
// byte nth x
mal.rep('(def! shl (fn* (a b) (js-eval (str b ".shln(" a ")")) ) )')
mal.rep('(def! shr (fn* (a b) (js-eval (str b ".shrn(" a ")")) ) )')
// mal.rep('(def! sar (fn* (a b) (js-eval (str b ">>>" a)) ) )')
// addmod
// mulmod
// signextend
// keccak256
// call
// callcode
// delegatecall
// staticcall
// gas
//address
mal.rep('(def! timestamp (fn* (a b) (js-eval "new Date().getTime()") ) )')

module.exports = mal;
