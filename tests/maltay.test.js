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

    // We have the list() function & the list type
    // they have different ids
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
    expr = expr2h('(fn* (a) a)');
    // resp = await MalTay.call(expr);
    // expect(resp).toBe(expr);

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

    expr = expr2h('(def! func1 (fn* (a b) (add a b)))');
    await MalTay.send(expr);
    resp = await MalTay.call('0x44444442' + name.hexEncode().padStart(64, '0'));
    expect(resp).toBe('0x8c0000289000000201000000000000000100000000000001');
    
    expr = expr2h('(_func1 2 3)', isFunction);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000005');

    expr = expr2h('(_func1 (add (add (sub 7 2) 1) 41) (add 2 3)))', isFunction);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000034');
});

it('test used stored fn 2', async function () {
    let expr, resp;
    let name = 'func2'

    expr = expr2h('(def! func2 (fn* (a b) (add (add (sub a b) a) b)))');
    await MalTay.send(expr);

    resp = await MalTay.call('0x44444442' + name.hexEncode().padStart(64, '0'));
    expect(resp).toBe(expr2h('(fn* (a b) (add (add (sub a b) a) b))'));

    expr = expr2h('(_func2 5 3)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000000a');
});

it('test if', async function () {
    let expr, resp;
    expr = expr2h('(if (gt 4 1) 7 8)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000007');

    expr = expr2h('(if (gt 4 9) 7 8)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000008');

    expr = expr2h('(if (gt 4 1) (add (sub 33 2) 1) (add (sub 7 2) 1))');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000020');

    expr = expr2h('(if (gt 4 9) (add (sub 33 2) 1) (add (sub 7 2) 1))');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000006');
});

it.skip('test if with lambda', async function () {
    let expr, resp;
    expr = expr2h('(if (gt 4 1) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000005');

    expr = expr2h('(if (gt 4 9) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000006');
});

it('test bytes concat', async function () {
    let expr, resp;
    expr = expr2h('(concat 0x"11" 0x"22")');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x040000021122');

    expr = expr2h('(concat 0x"11aaaabb" 0x"221111ccdd")');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0400000911aaaabb221111ccdd');
});

it('test bytes contig', async function () {
    let expr, resp;
    expr = expr2h('(contig 4 0x"22")');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0400000422222222');

    expr = expr2h('(contig 2 0x"221111ccdd")');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0400000a221111ccdd221111ccdd');
});

it('test map', async function () {
    let expr, resp;
    expr = expr2h('(def! myfunc (fn* (a) (mul (add a 1) 3)))');
    await MalTay.send(expr);

    expr = expr2h('(map _myfunc (list 5 8 2))');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x' + encode([{type: 'list'}], [[18, 27, 9]]));
});

it('test funcs', async function() {
    let expr, resp;

    resp = await MalTay.call(expr2h('(first (list 5 3 7))'));
    expect(resp).toBe('0x0a91000400000005');

    resp = await MalTay.call(expr2h('(rest (list 5 3 7))'));
    expect(resp).toBe('0x' + encode([{type: 'list'}], [[3, 7]]));

    resp = await MalTay.call(expr2h('(nth (list 5 3 7) 2)'));
    expect(resp).toBe('0x0a91000400000007');
});

