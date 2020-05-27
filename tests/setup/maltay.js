const ethers = require('ethers');
const { hexStripZeros, hexZeroPad } = ethers.utils;
const malReader = require('./mal/reader.js');
const malTypes = require('./mal/types.js');

const u2b = value => value.toString(2);
const u2h = value => value.toString(16);
const b2u = value => parseInt(value, 2);
const b2h = value => u2h(b2u(value));
const h2u = value => parseInt(value, 16);
const h2b = value => u2b(h2u(value));
const x0 = value => '0x' + value;
const strip0x = value => value.substring(0, 2) === '0x' ? value.substring(2) : value;

const arityb = arity => u2b(arity).padStart(4, '0');
const mutableb = mutable => mutable ? '1' : '0';
const fidb = id => u2b(id).padStart(26, '0');
const funcidb = name => {
    const nativef = typeof name === 'string' ? nativeEnv[name] : name;
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
    let id = b2h(typeid.unknown + u2b(index).padStart(24, '0')).padStart(8, '0');
    // this is not used directly, but it should be
    let value = u2h(index).padStart(8, '0');
    return id + value;
}

const typeid = {
    function: '1',
    array: '01',
    struct: '001',
    list: '0001',
    number: '00001',
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
    'fn*':        { mutable: false, arity: null, composed: ['apply', 'lambda'] },
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

// TODO: this only encodes uint
const encode = (types, values) => {
    if (types.length !== values.length) throw new Error('Encode - different lengths.');
   return types.map((t, i) => {
        switch (t.type) {
            case 'uint':
                let sizeb = u2b(t.size).padStart(16, '0')
                let id = typeid.number + numberid.uint + sizeb;
                // id = b2h(id).padStart(4, '0');
                id = strip0x(hexZeroPad(x0(b2h(id)), 4));
                const value = parseInt(values[i]);
                const padded = strip0x(hexZeroPad(
                    x0(u2h(value)),
                    t.size
                ));
                return id + padded;
            case 'list':
                let len = u2b(values[i].length).padStart(24, '0');
                let lid = typeid.list + u2b(1).padStart(4, '0') + len;
                // lid = b2h(lid).padStart(4, '0');
                lid = strip0x(hexZeroPad(x0(b2h(lid)), 4));
                return lid + values[i].map(value => encode([{type: 'uint', size: 4}], [value]))
                    .join('');
            default:
                throw new Error('Not implemented');
        }
    }).join('');
}

const ast2h = (ast, unkownMap={}) => {
    // do not count the function itselt
    const arity = ast.length - 1;
    return ast.map((elem, i) => {
        // if Symbol
        if (malTypes._symbol_Q(elem)) {
            if (!nativeEnv[elem.value]) {
                // at the moment, only lambda variables should end up here
                // lambda argument definition
                if (!unkownMap[elem.value]) {
                    unkownMap[elem.value] = unknown(i);
                    // TODO: now we don't include `(a, b)` from `fn* (a b) (add a b)`
                    return '';
                }
                return unkownMap[elem.value];
            }
            if (typeof nativeEnv[elem.value].hex === 'string') {
                return nativeEnv[elem.value].hex;
            }
            if (typeof nativeEnv[elem.value].hex !== 'function') {
                throw new Error('Unexpected native function: ' + elem.value);
            }
            
            // variadic functions
            if (nativeEnv[elem.value].composed) {
                // TODO: temporary fix, because only fn* is composed right now
                // apply arity: 1 + number of args
                // lambda: arity 1 (for body)

                const applyArity = ast[1].length + 1;
                const lambdaBody = ast2h([ast[1], ast[2]]);

                return nativeEnv.apply.hex(applyArity) + nativeEnv.lambda.hex(lambdaBody.length);
                // return nativeEnv[elem.value].hex([applyArity, lambdaBodyLen]);
            }
            return nativeEnv[elem.value].hex(arity);
        }

        if (elem instanceof Array) {
            return ast2h(elem, unkownMap);
        }

        // TODO
        if (parseInt(elem)) return encode([{type: 'uint', size: 4}], [elem]);

    }).join('');
}

const expr2h = expression => {
    const ast = malReader.read_str(expression);
    return x0(ast2h(ast));
}

module.exports = {
    u2b, u2h, b2u, b2h, h2u, h2b,
    typeid, nativeEnv,
    encode,
    expr2h,
    funcidb,
}

