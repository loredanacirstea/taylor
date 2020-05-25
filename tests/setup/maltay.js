const ethers = require('ethers');
const { hexStripZeros, hexZeroPad } = ethers.utils;

const u2b = value => value.toString(2);
const u2h = value => value.toString(16);
const b2u = value => parseInt(value, 2);
const b2h = value => u2h(b2u(value));
const h2u = value => parseInt(value, 16);
const h2b = value => u2b(h2u(value));
const x0 = value => '0x' + value;
const strip0x = value => value.substring(0, 2) === '0x' ? value.substring(2) : value;

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

const native = {
    add: '10100000000000000000000000000100',
    sub: '10100000000000000000000000001000',
}

const encode = (types, values) => {
    if (types.length !== values.length) throw new Error('Encode - different lengths.');
   return types.map((t, i) => {
        switch (t.type) {
            case 'uint':
                let sizeb =  u2b(t.size).padStart(16, '0')
                let id = typeid.number + numberid.uint + sizeb;
                id = strip0x(hexZeroPad(x0(b2h(id)), 4));
                const value = parseInt(values[i]);
                const padded = strip0x(hexZeroPad(
                    x0(u2h(value)),
                    t.size
                ));
                return id + padded;
            default:
                throw new Error('Not implemented');
        }
    }).join('');
}

const expr2h = expression => {
    const exprlist = expression.replace(/\(/g, '').replace(/\)/g, '').split(' ');
    const hexb = exprlist.map(elem => {
        if (native[elem]) return b2h(native[elem]);
        if (parseInt(elem)) return encode([{type: 'uint', size: 4}], [elem]);

        let list;
        try {
            list = JSON.parse(elem);
        } catch (e) {
            return '';
        }
        encode([{type: 'list', size: list.length}], [list]);
    }).join('');
    return x0(hexb);
}

module.exports = {
    u2b, u2h, b2u, b2h, h2u, h2b,
    typeid, native,
    encode,
    expr2h,
}

