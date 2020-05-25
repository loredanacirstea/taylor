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
    const nativef = nativeEnv[name];
    const f = arity => '1' + arityb(arity) + fidb(nativef.id) + mutableb(nativef.mutable);
    if (nativef.arity !== null) return f(nativef.arity);
    return f;
}

const typeid = {
    function: '1',
    array: '01',
    struct: '001',
    list: '0001',
    number: '00001',
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
}

Object.keys(nativeEnv).forEach((key, id) => {
    nativeEnv[key].id = id + 1;
    nativeEnv[key].encoded = funcidb(key);
    nativeEnv[key].hex = typeof nativeEnv[key].encoded === 'string'
        ? b2h(nativeEnv[key].encoded)
        : arity => b2h(nativeEnv[key].encoded(arity));
});

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

const ast2h = ast => {
    // do not count the function itselt
    const arity = ast.length - 1;
    return ast.map(elem => {
        // if Symbol
        if (malTypes._symbol_Q(elem)) {
            if (typeof nativeEnv[elem.value].hex === 'string') {
                return nativeEnv[elem.value].hex;
            }
            if (typeof nativeEnv[elem.value].hex !== 'function') {
                throw new Error('Unexpected native function: ' + elem.value);
            }
            // variadic function
            return nativeEnv[elem.value].hex(arity);
        }

        if (elem instanceof Array) {
            return ast2h(elem);
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
}

