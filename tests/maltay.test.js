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
    expect(expr).toBe('0x900000020a910004000000040a91000400000007');
    
    const resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000000b');
});

it('test sum-sub', async function () {
    const expr = expr2h('(add (add (sub 7 2) 1) 41)');
    expect(expr).toBe('0x9000000290000002900000040a910004000000070a910004000000020a910004000000010a91000400000029');

    const resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000002f');
});

it('test list', async function () {
    let resp;
    const expected = '0x' + encode([{type: 'list'}], [[5, 4, 8, 3, 5]]);
    
    const exprSimple = expr2h('(list 5 4 8 3 5)');
    resp = await MalTay.call(exprSimple);
    expect(resp).toBe(expected);

    const expr = expr2h('(list 5 4 (add 6 2) 3 (sub 6 1))');
    expect(expr).toBe('0xa800003e0a910004000000050a91000400000004900000020a910004000000060a910004000000020a91000400000003900000040a910004000000060a91000400000001');
    resp = await MalTay.call(expr);
    expect(resp).toBe(expected);
});
