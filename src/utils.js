const BN = require('bn.js');
const u2b = value => value.toString(2);
const u2h = value => value.toString(16);
const b2u = value => parseInt(value, 2);
const b2h = value => u2h(b2u(value));
const h2u = value => parseInt(value, 16);
const h2b = value => u2b(h2u(value));
const x0 = value => '0x' + value;
const strip0x = value => value.substring(0, 2) === '0x' ? value.substring(2) : value;
const toBN = value => {
    if (typeof value === 'object' && value._hex) value = new BN(strip0x(value._hex), 16);
    if (!BN.isBN(value)) value = new BN(value);
    return value;
}
const underNumberLimit = bnval => bnval.abs().lt(new BN(2).pow(new BN(16)));
const bytesMarker = '0x';

module.exports = {
    u2b, u2h, b2u, b2h, h2u, h2b,
    x0, strip0x,
    underNumberLimit, toBN,
    bytesMarker,
};
