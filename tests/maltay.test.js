const { provider, signer, getMalTay } = require('./setup/fixtures.js');
const { encode, expr2h } = require('./setup/maltay.js');

let MalTay;

beforeAll(() => {
  return getMalTay().then(t => {
    MalTay = t;
  });
});

it('test sum', async function () {
    const expr = expr2h('(add 4 7)');
    expect(expr).toBe('0xa00000040a910004000000040a91000400000007');
    
    const resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000000b');
});

// (add (add (sub 7 1) 1) 0x29)
it('test sum-sub', async function () {
    const expr = expr2h('(add (add (sub 7 2) 1) 41)');
    expect(expr).toBe('0xa0000004a0000004a00000080a910004000000070a910004000000020a910004000000010a91000400000029');

    const resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000002f');
});
