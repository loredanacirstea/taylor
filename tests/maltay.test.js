require('../maltay/extensions.js');
const { provider, signer, getMalTay } = require('./setup/fixtures.js');
const { encode, expr2h, b2h, u2b, u2h, funcidb } = require('../maltay/maltay.js');

let MalTay;

beforeAll(() => {
  return getMalTay().then(t => {
    MalTay = t;
  });
});

const isFunction = async name => (await MalTay.call('0x44444442' + name.hexEncode().padStart(64, '0'))).length > 2;

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

it('test lambda', async function () {
    let expr, resp;

    // TODO: return function type?
    // expr = expr2h('(fn* (a) a)');

    expr = expr2h('( (fn* (a) a) 7)');
    expect(expr).toBe('0x900000408c00001001000000000000000a91000400000007');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000007');

    expr = expr2h('( (fn* (a) (add a 1)) 10)');
    expect(expr).toBe('0x900000408c0000289000000201000000000000000a910004000000010a9100040000000a');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000000b');

    expr = expr2h('( (fn* (a b) (add a b)) 2 3)');
    expect(expr).toBe('0x980000408c00002890000002010000000000000001000000000000010a910004000000020a91000400000003');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000005');

    expr = expr2h('( (fn* (a b) (add a b)) (add (add (sub 7 2) 1) 41) (add 2 3))');
    expect(expr).toBe('0x980000408c00002890000002010000000000000001000000000000019000000290000002900000040a910004000000070a910004000000020a910004000000010a91000400000029900000020a910004000000020a91000400000003');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000034');

    expr = expr2h('( (fn* (a b) (add (mul a b ) b)) 2 3)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000009');
});

it('test lambda 1', async function () {
    let expr, resp;
    const lambdaRntArgs = '0a910004000000020a91000400000003';
    const lambdabdy =  b2h('10010000000000000000000000000010')  // ADD
        + b2h('00000001000000000000000000000000').padStart(8, '0')
        + '00'.padStart(8, '0')
        + b2h('00000001000000000000000000000001').padStart(8, '0')
        + '01'.padStart(8, '0')
    
    // 10001100000000000000000000100000
    const lambdasig = '100011' + u2b(lambdabdy.length / 2).padStart(25, '0') + '0';
    expr = '0x' + '98000040'  // apply
         + b2h(lambdasig)     // lambda
         + lambdabdy
         + lambdaRntArgs;
    
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000005');
});

it('test lambda 2', async function () {
    let expr, resp;

    const lambdaRntArgs = expr2h('(add (add (sub 7 2) 1) 41)').substring(2)
        + expr2h('(add 2 3)').substring(2);
    
    const lambdabdy =  b2h('10010000000000000000000000000010')  // ADD
        + b2h('00000001000000000000000000000000').padStart(8, '0')
        + '00'.padStart(8, '0')
        + b2h('00000001000000000000000000000001').padStart(8, '0')
        + '01'.padStart(8, '0')
    
    // 10001100000000000000000000100000
    const lambdasig = '100011' + u2b(lambdabdy.length / 2).padStart(25, '0') + '0';

    expr = '0x' + '98000040'  // apply
         + b2h(lambdasig)     // lambda
         + lambdabdy
         + lambdaRntArgs;
    
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000034');
});

it('test use stored fn 1', async function () {
    let expr, resp;
    let name = 'func1'

    expr = '0x' + expr2h('(def! func1 (fn* (a b) (add a b)))').substring(2);
    await MalTay.send(expr);
    resp = await MalTay.call('0x44444442' + name.hexEncode().padStart(64, '0'));
    expect(resp).toBe('0x980000408c0000289000000201000000000000000100000000000001');
    
    expr = '0x' + expr2h('(_func1 2 3)', isFunction).substring(2);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000005');


    expr = '0x' + expr2h('(_func1 (add (add (sub 7 2) 1) 41) (add 2 3)))', isFunction).substring(2);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000034');
});

it('test used stored fn 2', async function () {
    let signature, expr, resp;
    let name = 'func2'

    expr = '0x' + expr2h('(def! func2 (fn* (a b) (add (add (sub a b) a) b)))').substring(2);
    await MalTay.send(expr);

    resp = await MalTay.call('0x44444442' + name.hexEncode().padStart(64, '0'));
    expect(resp).toBe(expr2h('(fn* (a b) (add (add (sub a b) a) b))'));

    expr = '0x' + expr2h('(_func2 5 3)', isFunction).substring(2);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000000a');
});
