const ethers = require('ethers');
const BN = require('bn.js');
require('../extensions.js');
const malReader = require('../mal/reader.js');
const malTypes = require('../mal/types.js');
const { sendTransaction, call, getLogs } = require('../web3.js');
const nativeEvm = require('./evm.js');
const wrappedEvm = require('./evmw.js');
const nativeCore = require('./core.js');

const nativeEvm_ = {};
Object.keys(nativeEvm).forEach(fname => {
    nativeEvm_[fname + '_'] = nativeEvm[fname];
});

const nativeEnv = Object.assign({}, nativeEvm_, wrappedEvm, nativeCore);

const {
    u2b, u2h, b2u, b2h, h2u, h2b,
    x0, strip0x,
    underNumberLimit, toBN,
    bytesMarker,
} = require('../utils.js');
const { isHexString } = require('ethers/lib/utils');

const uint = (val, size=32) => u2h(val).padStart(size*2, '0');

const rootids = {
    number: '0001',
    listlike: '0010',
    function: '0011',
    bytelike: '0100',
    choicelike: '0101',
    mapping: '0111',
    other: '1000',
}
const subids_bytelike = {
    bytes: '01',
    string: '10',
}

const type_enc = {
    number: value => {
        const v = isHexString(value) ? new BN(value, 16) : new BN(value);
        return (
            (new BN(rootids.number.padEnd(32, '0'), 2)).toString(16)
            + v.toString(16).padStart(64, '0')
        );
    },
    bytelike: (value, isString=false, encoding=0) => {
        const head = rootids.bytelike + subids_bytelike[isString ? 'string' : 'bytes'];
        const val = strip0x(value);
        return (
            new BN(head.padEnd(32, '0'), 2).toString(16).padStart(8, '0')
            + new BN(val.length / 2).toString(16).padStart(8, '0')
            + val
        );
    },
    // TODO: mutability, etc.
    fmu: (name, bodylen, arity, stack = true) => {
        return (new BN(rootids.function + '0' + '001'
            + u2b(bodylen).padStart(14, '0')
            + u2b(stack ? 0 : 1).padStart(4, '0')
            + u2b(arity).padStart(6, '0')
        , 2)).toString(16) + nativeEnv[name].padStart(8, '0')
    },
}
type_enc.fpu = type_enc.fmu; // TODO fix

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
    'fn*': handleFn,
    if: handleIf,
    memory: handleMem,
    stack: handleStack,
}

function ast2h(ast, parent=null, unkownMap={}, defenv={}, arrItemType=null, reverseArgs=true, stack=true, envdepth=0) {
    if (!(ast instanceof Array)) ast = [ast];

    // add apply if needed and not applied yet
    if (ast && ast[0] && ast[0][0] && ast[0][0].value === 'fn*' &&
        (!parent || parent[0].value !== 'apply')
    ) {
        ast.splice(0, 0, malTypes._symbol('apply'));
    }

    if(reverseArgs) {
        ast = [ast[0]].concat(ast.slice(1).reverse());
    }

    if (ast[0] && ast[0].value && ast2hSpecialMap[ast[0].value]) {
        return ast2hSpecialMap[ast[0].value](ast, parent, unkownMap, defenv, arrItemType, reverseArgs, stack, envdepth);
    }

    // do not count the function itselt
    const arity = ast.length - 1;

    return ast.map((elem, i) => {
        // nil
        if (elem === null) return uint(0);

        if (elem && elem[0] && elem[0].value && ast2hSpecialMap[elem[0].value]) {
            return ast2hSpecialMap[elem[0].value](elem, parent, unkownMap, defenv, arrItemType, reverseArgs, stack, envdepth);
        }

        // if Symbol
        if (malTypes._symbol_Q(elem)) {
            let encoded;

            if (unkownMap[elem.value]) {
                const { index, depth } = unkownMap[elem.value]
                let val = type_enc.fpu('unknown', index, depth - envdepth, stack);

                if (elem.value === 'self' && ast[0] && ast[0].value === 'self') val = type_enc.fpu('apply', 0, arity + 1, stack) + val;
                return val;
            }

            if (typeof elem.value === 'string' && elem.value.slice(0, 2) === '0x') {
                // treat as uint
                return type_enc.number(elem.value);
            }

            const body = ast2h(ast.slice(1), ast, unkownMap, defenv, null, true, stack, envdepth);
            return type_enc.fpu(elem.value, body.length / 2, arity, stack);
        }

        if (elem instanceof Array) {
            return ast2h(elem, ast, unkownMap, defenv, null, true, stack, envdepth);
        }

        let value = elem;
        if (typeof elem === 'boolean') {
            value = elem ? 1 : 0;
        }
        if (typeof elem === 'string') {
            if (elem.slice(0, 2) === '0x') {
                // treat as bytes
                value = elem.slice(2);
                value = type_enc.bytelike(value);
                return value;
            } else {
                // value = parseInt(elem) || 0;
                value = value.hexEncode();
                value = type_enc.bytelike(value, true);
                return value;
            }
        }
        return type_enc.number(value);
    }).join('');
}

// apply byte(lambda)
function handleFn(ast, parent, unkownMap, defenv, arrItemType, reverseArgs, stack, envdepth) {
    envdepth += 1;
    const arity = ast[1].length;
    const unkownMapcpy = JSON.parse(JSON.stringify(unkownMap));
    let largs = [];

    let lambdaArgs = ast[1].map((elem, i) => {
        const index = i;
        const enc = type_enc.fpu('unknown', i, 0, stack);
        unkownMapcpy[elem.value] = { depth: envdepth, index: i };
        largs.push(index.toString(16).padStart(4, '0'));
        return enc;
    });

    lambdaArgs = lambdaArgs.join('');
    largs = largs.join('');
    const lambdaBody = ast2h(ast[2], ast, unkownMapcpy, defenv, null, true, stack, envdepth);
    // fpu?; body length (without args)
    let encoded = type_enc.fpu('fn*', lambdaBody.length/2, arity, stack)
        + largs
        + lambdaBody;
    encoded = type_enc.bytelike(encoded);
    return encoded;
}

// ast is inversed
function handleIf(ast, parent, unkownMap, defenv, arrItemType, reverseArgs, stack, envdepth) {
    const unknownMap_cpy = JSON.parse(JSON.stringify(unkownMap))
    const condition = ast2h(ast[3], ast, unknownMap_cpy, defenv, null, true, stack, envdepth);
    const action1body = ast2h(ast[2], ast, unknownMap_cpy, defenv, null, true, stack, envdepth);
    const action2body = ast2h(ast[1], ast, unknownMap_cpy, defenv, null, true, stack, envdepth);
    const len = (condition.length + action1body.length + action2body.length) / 2;
    return type_enc.fpu('if', len, 3, stack)
        + type_enc.bytelike(action2body)
        + type_enc.bytelike(action1body)
        + condition
}

function handleMem(ast, parent, unkownMap, defenv, arrItemType, reverseArgs, stack, envdepth) {
    return ast2h(ast[1], parent, unkownMap, defenv, null, true, false, envdepth);
}

function handleStack(ast, parent, unkownMap, defenv, arrItemType, reverseArgs, stack, envdepth) {
    return ast2h(ast[1], parent, unkownMap, defenv, null, true, true, envdepth);
}

function decode (data, returntypes) {
    // console.log('decode data', data, returntypes)
    let decoded;
    if (returntypes && returntypes[0] === 'string') {
        return data.slice(2).hexDecode();
    }
    if (returntypes === 'tuple') {
        const arity = ethers.utils.defaultAbiCoder.decode(['uint'], data)[0].toNumber();
        return ethers.utils.defaultAbiCoder.decode('uint '.repeat(arity).split(' '), '0x' + data.substring(66)).map(val => val.toNumber());
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

    interpreter.estimateGas_raw = async (data, txObj={}) => {
        txObj = Object.assign({
            from: await signer.getAddress(),
            to: interpreter.address,
            data,
        }, txObj);

        const res = await provider.estimateGas(txObj).catch(console.log);
        return {gas: res.toNumber(), executionGas: res.toNumber() - 21832}
    }

    interpreter.estimateGas = async (expression, txObj={}) => {
        txObj = Object.assign({
            from: await signer.getAddress(),
            to: interpreter.address,
            data: expr2h(expression).encoded,
        }, txObj);

        const res = await provider.estimateGas(txObj).catch(console.log);
        return {gas: res.toNumber(), executionGas: res.toNumber() - 21832}
    }

    interpreter.calculateCost = async (expression, txObj) => (await interpreter.estimateGas(expression, txObj)).gas * 2;

    return interpreter;
}


module.exports = {
    expr2h,
    getTay,
}
