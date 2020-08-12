const ethers = require('ethers');
const BN = require('bn.js');
const { hexZeroPad } = ethers.utils;
require('../extensions.js');
const malReader = require('../mal/reader.js');
const malTypes = require('../mal/types.js');
const { sendTransaction, call, getLogs } = require('../web3.js');
const jsBackend = require('../mal_backend.js');
const nativeEvm = require('./native_evm.js');
const nativeCore = require('./native_core.js');

const nativeEnv = Object.assign({}, nativeEvm, nativeCore);

const {
    u2b, u2h, b2u, b2h, h2u, h2b,
    x0, strip0x,
    underNumberLimit, toBN,
    bytesMarker,
} = require('../utils.js');

const uint = (val, size=32) => u2h(val).padStart(size*2, '0');
const rootids = {
    unknown: '04000000',
    func_pure_untyped: '34000000',
    func_mutable_untyped: '3b000000',
    number: '10000000',
}
const type_enc = {
    func: base => (id, bodylen, arity) => {
        return (
            (new BN(base, 16))
            .add((new BN(bodylen)).shln(6))
            .add(new BN(arity))
            .toString(16)
            + (new BN(id)).toString(16).padStart(8, '0')
        ).padStart(16, '0');
    },
    bytelike: (length) => '40000000' + (new BN(length)).toString(16).padStart(8, '0'),
    unknown: id => {
        return (
            (new BN(rootids.unknown, 16)).add(new BN(id))
        )
    },
}
type_enc.fpu = type_enc.func(rootids.func_pure_untyped);
type_enc.fmu = type_enc.func(rootids.func_mutable_untyped);

// let pureCount = 1, mutableCount = 1;
Object.keys(nativeEnv).forEach((name, i) => {
        const { arity, mutability } = nativeEnv[name];
        let appliedf, count = i+1;
        if (mutability) {
            appliedf = type_enc.fmu;
            // mutableCount ++;
            // count = mutableCount;
        } else {
            appliedf = type_enc.fpu;
            // pureCount ++;
            // count = pureCount;
        }
        const f = (arity, bodylen) => {
            bodylen = bodylen || arity * 32;
            return appliedf(count, bodylen, arity);
        }
        if (arity || arity === 0) {
            nativeEnv[name].id = f(arity)
            nativeEnv[name].hex = nativeEnv[name].id;
        }
        else {
            nativeEnv[name].hex = f;
        }
        nativeEnv[name].hexf = f;
    });

// console.log('nativeEnv', nativeEnv);

function expr2h(expression, defenv) {
    const ast = malReader.read_str(expression);
    const encoded = x0(ast2h(ast, null, {}, defenv));
    // console.log('encoded', encoded);
    return { encoded, ast };
}

const ast2hSpecialMap = {
    fn_: handleFn,
    if_: handleIf,
}

function ast2h(ast, parent=null, unkownMap={}, defenv={}, arrItemType=null) {
    if (!(ast instanceof Array)) ast = [ast];

    // do not count the function itselt
    const arity = ast.length - 1;

    if (ast[0] && ast[0].value && ast2hSpecialMap[ast[0].value]) {
        return ast2hSpecialMap[ast[0].value](ast, parent, unkownMap, defenv, arrItemType);
    }

    return ast.map((elem, i) => {
        // nil
        if (elem === null) return uint(0);

        // if Symbol
        if (malTypes._symbol_Q(elem)) {
            let encoded;

            if (unkownMap[elem.value]) {
                let val = unkownMap[elem.value];
                if (elem.value === 'self' && ast[0] && ast[0].value === 'self') val = nativeEnv.apply_.hex(arity + 1) + val;
                return val;
            }

            if (typeof elem.value === 'string' && elem.value.slice(0, 2) === '0x') {
                // treat as uint
                return rootids.number + elem.value.slice(2).padStart(64, '0');
            }
            if (typeof nativeEnv[elem.value].hex === 'string') {
                encoded = nativeEnv[elem.value].hex;
            }
            if (typeof nativeEnv[elem.value].hex === 'function') {
                const body = ast2h(ast.slice(1), ast, unkownMap, defenv);
                encoded = nativeEnv[elem.value].hex(arity, body.length / 2);
            }
            return encoded;
        }

        if (elem instanceof Array) {
            return ast2h(elem, ast, unkownMap, defenv);
        }

        let value = elem;
        if (typeof elem === 'boolean') {
            value = elem ? 1 : 0;
        }
        if (typeof elem === 'string') {
            if (elem.slice(0, 2) === '0x') {
                // treat as bytes
                value = elem.slice(2);
                value = type_enc.bytelike(value.length/2) + value; 
                return value;
            } else {
                // value = parseInt(elem) || 0;
                value = value.hexEncode();
                value = type_enc.bytelike(value.length/2) + value; 
                return value;
            }
        }

        return rootids.number + uint(value);
    }).join('');
}

function handleFn(ast, parent, unkownMap, defenv) {
    const arity = ast[1].length;
    const unkownMapcpy = JSON.parse(JSON.stringify(unkownMap))
    const count = Object.keys(unkownMapcpy).length;

    let lambdaArgs = ast[1].map((elem, i) => {
        const enc = type_enc.unknown(count + i + 1).toString(16).padStart(8, '0');
        unkownMapcpy[elem.value] = enc;
        return enc;
    });
    lambdaArgs.splice(0, 0, type_enc.unknown(count).toString(16).padStart(8, '0'));
    unkownMapcpy['self'] = lambdaArgs[0];
    lambdaArgs = lambdaArgs.join('');
    
    const lambdaBody = ast2h(ast[2], ast, unkownMapcpy, defenv);

    let encoded = nativeEnv.fn_.hex
        + type_enc.bytelike(lambdaArgs.length/2) + lambdaArgs
        + type_enc.bytelike(lambdaBody.length/2) + lambdaBody;

    // we execute it with apply only if there is a parent ast
    // with this lambda at index 0
    if (parent && parent[0][0] && parent[0][0].value === ast[0].value) {
        // apply arity: 1 + number of args
        encoded = nativeEnv.apply_.hex(arity + 1) + encoded;
    }
    return encoded;
}

function handleIf(ast, parent, unkownMap, defenv) {
    const unknownMap_cpy = JSON.parse(JSON.stringify(unkownMap))
    const condition = ast2h(ast[1], ast, unknownMap_cpy, defenv);
    const action1body = ast2h(ast[2], ast, unknownMap_cpy, defenv);
    const action2body = ast2h(ast[3], ast, unknownMap_cpy, defenv);
    return nativeEnv.if_.hex
        + condition        
        + type_enc.bytelike(action1body.length/2) + action1body
        + type_enc.bytelike(action2body.length/2) + action2body
}

function decode (data, returntypes) {
    console.log('decode data', data, returntypes)
    let decoded;
    if (returntypes && returntypes[0] === 'string') {
        return data.slice(2).hexDecode();
    }
    if (returntypes) {
        decoded = ethers.utils.defaultAbiCoder.decode(returntypes, data);
    } else decoded = [data];
    decoded = decoded.map(result => {
        if (typeof result === 'object') {
            result = toBN(result);
            result = underNumberLimit(result) ? result.toNumber() : result;
        }
        return result;
    });
    return decoded.length > 1 ? decoded : decoded[0];
}

const getTay = (provider, signer) => (address, deploymentBlock) => {
    deploymentBlock = deploymentBlock || 0;
    const interpreter = {
        address: address.toLowerCase(),
        send_raw: sendTransaction(signer)(address),
        call_raw: call(provider)(address),
        fromBlock: deploymentBlock,
        getLogs: getLogs(provider)(address),
        provider,
        signer,
        expr2h: (expression, defenv) => (expr2h(expression, defenv)).encoded,
    }

    interpreter.call = async (expr, txObj, returntypes) => {
        const {encoded, ast} = expr2h(expr);
        if (typeof returntypes === 'undefined') {
            let ispointer = ast[0].value && ast[0].value.includes('__');
            if (!ispointer) {
                ispointer = ast[0].value && ast[0].value.includes('#') && ast[1] && ast[1] instanceof Array && ast[1][0].value.includes('__');
            }
            if (ispointer) returntypes = null;
            else returntypes = ['uint'];
        }
        return decode(await interpreter.call_raw(encoded, txObj), returntypes);
    }

    interpreter.send = async (expression, txObj={}, newsigner=null) => {
        // if(!txObj.value && !newsigner) {
        //     txObj.value = await interpreter.calculateCost(expression, txObj);
        // }
        // if(!txObj.gasLimit && !newsigner) {
        //     txObj.gasLimit = await interpreter.estimateGas(expression, txObj).catch(console.log);
        //     txObj.gasLimit = txObj.gasLimit ? (txObj.gasLimit.toNumber() + 100000) : 1000000;
        // }
        if (!newsigner) {
            return interpreter.send_raw(expr2h(expression).encoded, txObj);
        }
        // return sendTransaction(newsigner)(interpreter.address)(
        //     expr2h(expression),
        //     txObj,
        // )
    }

    interpreter.init = () => {};
    interpreter.watch = () => {};
    interpreter.estimateGas = () => new BN(1000000);
    interpreter.calculateCost = () => 1000000

    return interpreter;
}


module.exports = {
    expr2h,
    getTay,
    js: jsBackend,
}
