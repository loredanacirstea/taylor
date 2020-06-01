const ethers = require('ethers');
const { hexStripZeros, hexZeroPad } = ethers.utils;
const malReader = require('./mal/reader.js');
const malTypes = require('./mal/types.js');
require('./extensions.js');

const u2b = value => value.toString(2);
const u2h = value => value.toString(16);
const b2u = value => parseInt(value, 2);
const b2h = value => u2h(b2u(value));
const h2u = value => parseInt(value, 16);
const h2b = value => u2b(h2u(value));
const x0 = value => '0x' + value;
const strip0x = value => value.substring(0, 2) === '0x' ? value.substring(2) : value;

const bytesMarker = '0x';
const arityb = arity => u2b(arity).padStart(4, '0');
const mutableb = mutable => mutable ? '1' : '0';
const fidb = id => u2b(id).padStart(26, '0');
const funcidb = name => {
    const nativef = typeof name === 'string' ? nativeEnv[name] : name;
    if (nativef.hex) return nativef;
    
    let binf, hex;
    if (!nativef.composed) {
        binf = arity => '1' + arityb(arity) + fidb(nativef.id) + mutableb(nativef.mutable);
    } else {
        const composedf = nativef.composed.map(cname => funcidb(cname));
        binf = arities => composedf.map((funcs, i) => typeof funcs.bin === 'string' ? funcs.bin : funcs.bin(arities[i])).join('');
        hex = arities => composedf.map((funcs, i) => typeof funcs.hex === 'string' ? funcs.hex : funcs.hex(arities[i])).join('');
    }
    
    if (nativef.arity !== null) {
        const bin = binf(nativef.arity);
        return { bin, hex: b2h(bin) }
    }
    return { bin: binf, hex: hex || (arity => b2h(binf(arity))) }
}
const unknown = index => {
    let id = b2h(typeid.unknown + '0'.padStart(24, '0')).padStart(8, '0');
    let value = u2h(index).padStart(8, '0');
    return id + value;
}
const listTypeId = len => strip0x(hexZeroPad(x0(b2h(
    typeid.list + u2b(1).padStart(4, '0') + len
)), 4));

const typeid = {
    function: '1',
    array: '01',
    struct: '001',
    list: '0001',
    number: '00001',
    bytelike: '000001',
    enum: '0000001',
    unknown: '00000001'
}

const numberid = {
    complex: '00000000000',
    real: '01000000000',
    bigfloat: '01000000000',
    float: '01000001000',
    irrational: '01001000000',
    bool: '01010000000',
    bigint: '01010001000',
    int: '01010001001',
    biguint: '01010010000',
    uint: '01010010001',
}

const nativeEnv = {
    // EVM specific
    add:          { mutable: false, arity: 2 },
    sub:          { mutable: false, arity: 2 },
    mul:          { mutable: false, arity: 2 },
    div:          { mutable: false, arity: 2 },
    sdiv:         { mutable: false, arity: 2 },
    mod:          { mutable: false, arity: 2 },
    smod:         { mutable: false, arity: 2 },
    exp:          { mutable: false, arity: 2 },
    not:          { mutable: false, arity: 1 },
    lt:           { mutable: false, arity: 2 },
    gt:           { mutable: false, arity: 2 },
    slt:          { mutable: false, arity: 2 },
    sgt:          { mutable: false, arity: 2 },
    eq:           { mutable: false, arity: 2 },
    iszero:       { mutable: false, arity: 1 },
    and:          { mutable: false, arity: 2 },
    or:           { mutable: false, arity: 2 },
    xor:          { mutable: false, arity: 2 },
    byte:         { mutable: false, arity: 2 },
    shl:          { mutable: false, arity: 2 },
    shr:          { mutable: false, arity: 2 },
    sar:          { mutable: false, arity: 2 },
    addmod:       { mutable: false, arity: 3 },
    mulmod:       { mutable: false, arity: 3 },
    signextend:   { mutable: false, arity: 2 },
    keccak256:    { mutable: false, arity: 2 },
    call:         { mutable: true, arity: 2 },
    callcode:     { mutable: true, arity: 2 },
    delegatecall: { mutable: true, arity: 2 },
    staticcall:   { mutable: false, arity: 2 },
    
    // Mal specific
    list:         { mutable: false, arity: null },
    apply:        { mutable: false, arity: null },
    lambda:       { mutable: false, arity: null },
    'fn*':        { mutable: false, arity: null },
    'def!':       { mutable: false, arity: 2 },
    getf:         { mutable: false, arity: null },
    if:           { mutable: false, arity: 3 },
    contig:       { mutable: false, arity: 2 },
    concat:       { mutable: false, arity: 2 },
    map:          { mutable: false, arity: 2 },
    reduce:       { mutable: false, arity: 3 },
    nth:          { mutable: false, arity: 2 },
    first:        { mutable: false, arity: 1 },
    rest:         { mutable: false, arity: 1 },
    'empty?':     { mutable: false, arity: 1 },
    'true?':      { mutable: false, arity: 1 },
    'false?':     { mutable: false, arity: 1 },

    // Mal specific - unimplemented, just placeholders
    cons:         { mutable: false, arity: 2 },  // prepend item to list
    concat2:      { mutable: false, arity: null },  // concats lists
    'nil?':       { mutable: false, arity: 1 },
    'list?':      { mutable: false, arity: 1 },
    vector:       { mutable: false, arity: null },
    'vector?':    { mutable: false, arity: 1 },
    'sequential?':{ mutable: false, arity: 1 },
    'hash-map':   { mutable: false, arity: null },
    'map?':       { mutable: false, arity: 1 },
    assoc:        { mutable: false, arity: null },
    dissoc:       { mutable: false, arity: 2 },
    get:          { mutable: false, arity: 2 },
    'contains?':  { mutable: false, arity: 2 },
    keys:         { mutable: false, arity: 1 },
    vals:         { mutable: false, arity: 1 },
    'fn?':        { mutable: false, arity: 1 },
    'string?':    { mutable: false, arity: 1 },
    'number?':    { mutable: false, arity: 1 },
    seq:          { mutable: false, arity: 1 },
    conj:         { mutable: false, arity: 1 },
    symbol:       { mutable: false, arity: 1 },
    'symbol?':    { mutable: false, arity: 1 },
    keyword:      { mutable: false, arity: 1 },
    'keyword?':   { mutable: false, arity: 1 },
    count:        { mutable: false, arity: 1 },
    do:           { mutable: false, arity: 1 },
    'try*':       { mutable: false, arity: 2 },
    'catch*':     { mutable: false, arity: 2 },
    throw:        { mutable: false, arity: 1 },
    'defmacro!':  { mutable: false, arity: 2 },
    is_macro_call:{ mutable: false, arity: 2 },
    macroexpand:  { mutable: false, arity: 2 },
    atom:         { mutable: false, arity: 1 },
    'atom?':      { mutable: false, arity: 1 },
    deref:        { mutable: false, arity: 1 },
    'swap!':      { mutable: false, arity: null },
    'reset!':     { mutable: false, arity: 1 },
    'time-ms':    { mutable: false, arity: 0 },
    meta:         { mutable: false, arity: 1 },
    'with-meta':  { mutable: false, arity: 2 },
    quote:        { mutable: false, arity: null },
    quasiquote:   { mutable: false, arity: null },
    prn:          { mutable: false, arity: null },
    'pr-str':     { mutable: false, arity: null },
    str:          { mutable: false, arity: null },
    println:      { mutable: false, arity: null },
    readline:     { mutable: false, arity: 1 },
    
    // Taylor specific
    'register!':  { mutable: false, arity: 1 },
    'getregistered':  { mutable: false, arity: 1 },
}

Object.keys(nativeEnv).forEach((key, id) => {
    nativeEnv[key].id = id + 1;
    nativeEnv[key].idb = fidb(nativeEnv[key].id);
    nativeEnv[key].idmask = '10000' + nativeEnv[key].idb + '0';
    nativeEnv[key].idmaskhex = b2h(nativeEnv[key].idmask);
    const { bin, hex } = funcidb(key);
    nativeEnv[key].encoded = bin;
    nativeEnv[key].hex = hex;
});
nativeEnv.lambda.encoded = bodylenb => '100011' + u2b(bodylenb / 2).padStart(25, '0') + '0';
nativeEnv.lambda.hex = bodylenb => b2h(nativeEnv.lambda.encoded(bodylenb));

// console.log('nativeEnv', nativeEnv);

const reverseNativeEnv = {};
Object.keys(nativeEnv).forEach(key => {
    if (typeof nativeEnv[key].hex === 'string') {
        reverseNativeEnv[nativeEnv[key].hex] = key;
    }
});
const formatId = id => strip0x(hexZeroPad(x0(b2h(id)), 4));
const getnumberid = size => formatId(typeid.number + numberid.uint + u2b(size).padStart(16, '0'))
const getboolid = value => formatId(typeid.number + numberid.bool + u2b(value ? 1 : 0).padStart(16, '0'));
const getbytesid = length => formatId(typeid.bytelike + u2b(length).padStart(26, '0'));

const isFunction = sig => (sig & 2147483648) !== 0;
const isLambda = sig => (sig & 0x4000000) !== 0;
const isApply = sig => (sig & 0x7fffffe) === 0x40;
const isList = sig => (sig & 0x7fffffe) === 0x3e;
const isArray = sig => (sig & 0x40000000) !== 0;
const isStruct = sig => (sig & 0x20000000) !== 0;
const isListType = sig => (sig & 0x10000000) !== 0;
const isNumber = sig => (sig & 0x8000000) !== 0;
const isBool = sig => (sig & 0x0a800000) === 0x0a800000;
const isBytelike = sig => (sig & 0x4000000) !== 0;
const isEnum = sig => (sig & 0x2000000) !== 0;
const isLambdaUnknown = sig => (sig & 0x1000000) !== 0;
const isGetByName = sig => (sig & 0x7fffffe) === 0x48;

const numberSize = sig => sig & 0xffff;
const listTypeSize = sig => sig & 0xffffff;
const bytelikeSize = sig => sig & 0x3ffffff;
const funcArity = sig => (sig & 0x78000000) >> 27;
const lambdaLength = sig => (sig & 0x3fffffe) >> 1;
const getSignatureLength = 4;
// const getValueLength = 

const tableSig = {}
tableSig[nativeEnv['def!'].hex] = {offsets: [64, 8], aritydelta: -1}
tableSig[nativeEnv['if'].hex] = {offsets: [8, 8], aritydelta: 0}
tableSig['lambda'] = {offsets: lambdaLength}
tableSig['isGetByName'] = {offsets: [64]}

// TODO: this only encodes uint
const encode = (types, values) => {
    if (types.length !== values.length) throw new Error('Encode - different lengths.');
   return types.map((t, i) => {
        switch (t.type) {
            case 'uint':
                const id = getnumberid(t.size)
                const value = parseInt(values[i]);
                const padded = strip0x(hexZeroPad(
                    x0(u2h(value)),
                    t.size
                ));
                return id + padded;
            case 'bytes':
                if (!ethers.utils.isHexString(x0(values[i]))) {
                    throw new Error('Invalid bytes literal.')
                }
                const val = strip0x(values[i]);
                const length = val.length / 2;
                return  getbytesid(length) + val;
            case 'list':
                let len = u2b(values[i].length).padStart(24, '0');
                const lid = listTypeId(len);

                return lid + values[i].map(value => encode([{type: 'uint', size: 4}], [value]))
                    .join('');
            case 'bool':
                return getboolid(values[i]);
            default:
                throw new Error('Not implemented');
        }
    }).join('');
}

const decodeInner = (sig, data) => {
    if (isNumber(sig)) {
        const size = numberSize(sig);
        result = h2u(data.substring(0, size*2));
        data = data.substring(size*2);
        return { result, data };
    } else if (isBytelike(sig)) {
        const length = bytelikeSize(sig);
        result = data.substring(0, length*2)
        data = data.substring(length*2);
        return { result, data };
    } else if (isListType(sig)) {
        const length = listTypeSize(sig);
        
        const result = [...new Array(length)].map((_, i) => {
            const partsig = parseInt(data.substring(0, 8), 16);
            let result;
            ({result, data} = decodeInner(partsig, data.substring(8)));
            return result;
        });
        return { result, data };
    } else {
        throw new Error('decode type not supported: ' + sig);
    }
}

const decode = data => {
    data = strip0x(data);
    const decoded = [];

    while (data.length > 0) {
        let result;
        const sig = parseInt(data.substring(0, 8), 16);
        ({result, data} = decodeInner(sig, data.substring(8)));
        decoded.push(result);
    }
    return decoded;
}

const ast2h = (ast, parent=null, unkownMap={}, defenv={}) => {
    // do not count the function itselt
    const arity = ast.length - 1;

    if (ast[0] && ast[0].value === 'def!') {
        const elem = ast[0];
        const defname = ast[1].value.hexEncode().padStart(64, '0');
        const exprbody = ast2h(ast[2], ast, defenv);
        const exprlen = u2h(exprbody.length / 2).padStart(8, '0');
        return nativeEnv[elem.value].hex + defname + exprlen + exprbody;
    }
    return ast.map((elem, i) => {
        // if Symbol
        if (malTypes._symbol_Q(elem)) {
            if (!nativeEnv[elem.value]) {
                if (elem.value === bytesMarker) {
                    const typeid = getbytesid(ast[i + 1].length / 2);
                    return  typeid + ast[i + 1];
                }
                // check if stored function first
                // TODO: on-chain check
                // const isfunc = defenv.isFunction(elem.value)
                if (!unkownMap[elem.value] && elem.value[0] === '_') {
                    // TODO proper type - string/bytes
                    const encodedName = getnumberid(32) + elem.value.substring(1).hexEncode().padStart(64, '0');

                    // if function is first arg, it is executed
                    // otherwise, it is referenced as an argument (lambda)
                    let arity = ast[0].value === elem.value ? ast.length : 1;
                    // getf <fname>
                    return nativeEnv.getf.hex(arity) + encodedName;
                }
                
                // lambda variables should end up here
                // lambda argument definition
                if (!unkownMap[elem.value]) {
                    unkownMap[elem.value] = unknown(i);
                    // TODO: now we don't include `(a, b)` from `fn* (a b) (add a b)`
                    return '';
                }
                return unkownMap[elem.value];
            }
            if (elem.value === 'if') {
                const action1body = ast2h([ast[2]], null, defenv);
                const action2body = ast2h([ast[3]], null, defenv);
                return nativeEnv[elem.value].hex
                    + u2h(action1body.length / 2).padStart(8, '0')
                    + u2h(action2body.length / 2).padStart(8, '0');
            }
            if (typeof nativeEnv[elem.value].hex === 'string') {
                return nativeEnv[elem.value].hex;
            }
            if (typeof nativeEnv[elem.value].hex !== 'function') {
                throw new Error('Unexpected native function: ' + elem.value);
            }

            // variadic functions

            if (elem.value === 'fn*') {
                const lambdaBody = ast2h([ast[1], ast[2]], null, defenv);
                let encoded = nativeEnv.lambda.hex(lambdaBody.length);
                const arity = ast[1].length;

                // we execute it with apply only if there is a parent ast
                // with this lambda at index 0
                if (parent && parent[0][0] && parent[0][0].value === elem.value) {
                    // apply arity: 1 + number of args
                    encoded = nativeEnv.apply.hex(arity + 1) + encoded;
                }
                return encoded;
            }

            return nativeEnv[elem.value].hex(arity);
        }

        if (elem instanceof Array) {
            return ast2h(elem, ast, unkownMap, defenv);
        }

        if (typeof elem === 'boolean') {
            return encode([{type: 'bool'}], [elem]);
        }

        // TODO
        if (
            (parseInt(elem) || parseInt(elem) === 0)
            && (!ast[i - 1] || ast[i - 1].value !== bytesMarker)
        ) {
            return encode([{type: 'uint', size: 4}], [elem]);
        }

    }).join('');
}

const expr2h = (expression, defenv) => {
    const ast = malReader.read_str(expression);
    return x0(ast2h(ast, null, {}, defenv));
}

const expr2string = (inidata, pos=0, accum='') => {
    let name, arity;
    let unknownList = [];
    let data = inidata.substring(pos);
    const sig = data.substring(0, 8);
    const sigu = parseInt(sig, 16);
    data = data.substring(8);
    pos += 8;

    const isf = isFunction(sigu);

    if (isf) {
        if (reverseNativeEnv[sig]) {
            name =  reverseNativeEnv[sig];
            accum += '(' + name + ' ';
            arity = funcArity(sigu);
        }
        
        if (name === 'def!') {
            const fname = data.substring(0, tableSig[sig].offsets[0]).hexDecode();
            accum += ' ' + fname.toString() + ' ';
            data = data.substring(tableSig[sig].offsets[0]);
            pos += tableSig[sig].offsets[0]
            
            const exprlen = data.substring(0, tableSig[sig].offsets[1]);
            data = data.substring(tableSig[sig].offsets[1]);
            pos += tableSig[sig].offsets[1]

            const res = expr2string(inidata, pos, accum);
            pos = res.pos;
            accum = res.accum;
        } else if (name === 'if') {
            const action1bodyLen = parseInt(data.substring(0, tableSig[sig].offsets[0]), 16);
            const action2bodyLen = parseInt(data.substring(0, tableSig[sig].offsets[1]), 16);
            
            let res = expr2string(inidata, pos + tableSig[sig].offsets[0] + tableSig[sig].offsets[1], accum);
            pos = res.pos;
            accum = res.accum;

            res = expr2string(inidata, pos, accum)
            pos = res.pos;
            accum = res.accum;
            res = expr2string(inidata, pos, accum)
            pos = res.pos;
            accum = res.accum;

        } else if (isLambda(sigu)) {
            accum += '( fn* () '
            const bodylen = tableSig.lambda.offsets(sigu);
            const res = expr2string(inidata, pos, accum)
            accum = res.accum;
        } else if (isGetByName(sigu)) {
            const fname = data.substring(8, tableSig.isGetByName.offsets[0]+8).hexDecode();
            accum += '( _' + fname + ' '
            pos += tableSig.isGetByName.offsets[0] + 8
            const res = expr2string(inidata, pos, accum)
            accum = res.accum;
        }
        else {
            for(let i = 0; i < arity; i++) {
                let res = expr2string(inidata, pos , accum)
                pos = res.pos;
                accum = res.accum;
            }
        }
        accum += ')'
    }
    else if (isLambdaUnknown(sigu)) {
        const index = parseInt(data.substring(0, 8), 16)
        const uname = 'u_'+index + ' '
        unknownList.push(uname);
        accum += ' ' + uname
        pos += 8
    }
    else {
        const res = decodeInner(sigu, data)
        accum += ' ' + res.result.toString()
        pos = inidata.length - res.data.length;
    }
    return { pos, accum };
}

const expr2s = inidata => expr2string(strip0x(inidata)).accum;

module.exports = {
    u2b, u2h, b2u, b2h, h2u, h2b,
    typeid, nativeEnv,
    encode,
    decode,
    expr2h,
    funcidb,
    expr2s,
}

