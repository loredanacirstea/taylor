const BN = require('bn.js');
const ethers = require('ethers');

const u2b = value => value.toString(2);
const u2h = value => value.toString(16);
const b2u = value => parseInt(value, 2);
const b2h = value => u2h(b2u(value));
const h2u = value => parseInt(value, 16);
const h2b = value => u2b(h2u(value));
const x0 = value => '0x' + value;
const strip0x = value => value.substring(0, 2) === '0x' ? value.substring(2) : value;
const toBN = n => {
    if (typeof n === 'string' && n.substring(0, 2) === '0x') {
        return new BN(n.substring(2), 16);
    }
    if (BN.isBN(n)) return n;
    if (typeof n === 'object' && n._hex) {
        let value = strip0x(n._hex);
        const isneg = value[0] === '-';
        if (isneg) value = value.substring(1);
        value = new BN(value, 16);
        if (isneg) value = new BN(0).sub(value);
        return value;
    }
    return new BN(n);
}
const underNumberLimit = bnval => bnval.abs().lt(new BN(2).pow(new BN(16)));
const bytesMarker = '0x';

const evenHex = hexString => (hexString.length % 2 === 1) ? '0' + hexString : hexString;
const hexToUint8Array = hexString => ethers.utils.arrayify('0x' + evenHex(strip0x(hexString)));
const uint8ArrayToHex = uint8arr => ethers.utils.hexlify(uint8arr);
const decodeUint8 = (types, uint8arr) => ethers.utils.defaultAbiCoder.decode(types, uint8ArrayToHex(uint8arr));
const encodeUint8 = (types, args) => {
    const encoded = ethers.utils.defaultAbiCoder.encode(types, args);
    return hexToUint8Array(encoded);
}
const uint8arrToBN = uint8arr => new BN(strip0x(uint8ArrayToHex(uint8arr)), 16);
const uint8ArrayToHexAddr = uint8arr => uint8arrToBN(uint8arr);

module.exports = {
    u2b, u2h, b2u, b2h, h2u, h2b,
    x0, strip0x,
    underNumberLimit, toBN,
    bytesMarker,
    hexToUint8Array,
    uint8ArrayToHex,
    uint8arrToBN,
    uint8ArrayToHexAddr,
    decodeUint8,
    encodeUint8,
};
