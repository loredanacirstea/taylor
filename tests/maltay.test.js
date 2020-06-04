require('../maltay/extensions.js');
const { provider, signer, getTaylor } = require('./setup/fixtures.js');
const { encode, decode, expr2h, b2h, u2b, expr2s } = require('../maltay/maltay.js');

let MalTay;

beforeAll(() => {
  return getTaylor().then(t => {
    MalTay = t;
  });
});

const isFunction = async name => (await MalTay.call('0x44444442' + name.hexEncode().padStart(64, '0'))).length > 2;

it('test sum', async function () {
    const expr = expr2h('(add 4 7)');
    expect(expr).toBe('0x900000020a910004000000040a91000400000007');
    expect(expr2h(expr2s(expr))).toBe(expr);
    
    const resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000000b');
});

it('test sum-sub', async function () {
    const expr = expr2h('(add (add (sub 7 2) 1) 41)');
    expect(expr).toBe('0x9000000290000002900000040a910004000000070a910004000000020a910004000000010a91000400000029');
    expect(expr2h(expr2s(expr))).toBe(expr);

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
    // expect(expr2h(expr2s(expr))).toBe(expr);

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
    // expect(expr2h(expr2s(expr))).toBe(expr);
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
    // expect(expr2h(expr2s(expr))).toBe(expr);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000034');

    resp = await MalTay.getStoredFunctions();
    expect(resp.length).toBe(1);
    expect(resp[0].name).toBe('func1');
});

it('test used stored fn 2', async function () {
    let expr, resp;
    let name = 'func2'

    expr = expr2h('(def! func2 (fn* (a b) (add (add (sub a b) a) b)))');
    // expect(expr2h(expr2s(expr))).toBe(expr);
    await MalTay.send(expr);

    resp = await MalTay.call('0x44444442' + name.hexEncode().padStart(64, '0'));
    expect(resp).toBe(expr2h('(fn* (a b) (add (add (sub a b) a) b))'));

    expr = expr2h('(_func2 5 3)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000000a');

    resp = await MalTay.getStoredFunctions();
    expect(resp.length).toBe(2);
    expect(resp[0].name).toBe('func1');
    expect(resp[1].name).toBe('func2');
});

it('test if', async function () {
    let expr, resp;
    expr = expr2h('(if (gt 4 1) 7 8)');
    expect(expr2h(expr2s(expr))).toBe(expr);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000007');

    expr = expr2h('(if (gt 4 9) 7 8)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000008');

    expr = expr2h('(if (gt 4 1) (add (sub 33 2) 1) (add (sub 7 2) 1))');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000020');

    expr = expr2h('(if (gt 4 9) (add (sub 33 2) 1) (add (sub 7 2) 1))');
    expect(expr2h(expr2s(expr))).toBe(expr);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000006');
});

it.skip('test if with lambda', async function () {
    let expr, resp;
    expr = expr2h('(if (gt 4 1) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000005');

    expr = expr2h('(if (gt 4 9) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))');
    // expect(expr2h(expr2s(expr))).toBe(expr);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000006');
});

it('test bytes concat', async function () {
    let expr, resp;
    expr = expr2h('(concat 0x"11" 0x"22")');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x040000021122');

    expr = expr2h('(concat 0x"11aaaabb" 0x"221111ccdd")');
    // expect(expr2h(expr2s(expr))).toBe(expr);
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0400000911aaaabb221111ccdd');
});

it('test bytes contig', async function () {
    let expr, resp;
    expr = expr2h('(contig 4 0x"22")');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0400000422222222');

    expr = expr2h('(contig 2 0x"221111ccdd")');
    // expect(expr2h(expr2s(expr))).toBe(expr);
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
    
    resp = await MalTay.getStoredFunctions();
    expect(resp.length).toBe(3);
    expect(resp[2].name).toBe('myfunc');
});

it('test funcs', async function() {
    let resp;

    resp = await MalTay.call(expr2h('(empty? (list))'));
    expect(resp).toBe('0x0a800001');
    resp = await MalTay.call(expr2h('(empty? (list 1))'));
    console.log('resp', expr2h('(empty? (list 1))'))
    expect(resp).toBe('0x0a800000');
    resp = await MalTay.call(expr2h('(empty? (list 0))'));
    expect(resp).toBe('0x0a800000');

    resp = await MalTay.call(expr2h('(true? true)'));
    expect(resp).toBe('0x0a800001');
    resp = await MalTay.call(expr2h('(true? false)'));
    expect(resp).toBe('0x0a800000');

    resp = await MalTay.call(expr2h('(false? false)'));
    expect(resp).toBe('0x0a800001');
    resp = await MalTay.call(expr2h('(false? true)'));
    expect(resp).toBe('0x0a800000');
    
    resp = await MalTay.call(expr2h('(first (list 5 3 7))'));
    expect(resp).toBe('0x0a91000400000005');

    resp = await MalTay.call(expr2h('(rest (list 5 3 7))'));
    expect(resp).toBe('0x' + encode([{type: 'list'}], [[3, 7]]));

    resp = await MalTay.call(expr2h('(nth (list 5 3 7) 2)'));
    expect(resp).toBe('0x0a91000400000007');
});

it('test reduce', async function () {
    let expr, resp;
    
    expr = expr2h('(def! myfunc2 (fn* (a b) (add a b)) )');
    await MalTay.send(expr);

    expr = expr2h('(_myfunc2 4 5)');    
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000009');

    resp = await MalTay.call(expr2h('(_myfunc2 0 5)'))
    expect(resp).toBe('0x0a91000400000005');

    expr = expr2h('(reduce _myfunc2 (list 5 8 2) 0)');    
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a9100040000000f');
});

it('test recursive', async function () {
    let expr, resp;
    
    expr = expr2h('(def! recursive (fn* (n) (if (gt n 5) n (_recursive (add n 1)) ) ) )');
    // expect(expr2h(expr2s(expr))).toBe(expr);
    await MalTay.send(expr);
    
    expr = expr2h('(_recursive 2)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000006');
});

it('test recursive fibonacci', async function () {
    expr = expr2h('(def! fibonacci (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(_fibonacci (sub n 1)) (_fibonacci (sub n 2)) ) )))');

    await MalTay.send(expr);

    expr = expr2h('(_fibonacci 1)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000001');

    expr = expr2h('(_fibonacci 2)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000001');

    expr = expr2h('(_fibonacci 3)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000002');

    expr = expr2h('(_fibonacci 8)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x0a91000400000015');
});

it('test reduce recursive', async function () {
    let expr, resp;

    expr = expr2h('(def! myfunc3 (fn* (a b) (add a b)) )');
    await MalTay.send(expr);

    expr = expr2h('(def! reduce (fn* (f init xs) (if (empty? xs) init (reduce f (f init (first xs)) (rest xs)))))');
    await MalTay.send(expr);

    resp = await MalTay.call(expr2h('(reduce _myfunc3 (list 5 8 2) 0 )'));
    expect(resp).toBe('0x0a9100040000000f');
});

it('test registration & executing from root contract', async function () {
    let expr, resp;

    const maltay2 = await getTaylor();
    const maltay3 = await getTaylor();

    // Register
    // TODO: type integer
    expr = expr2h('(register! 0x"' + maltay2.address.substring(2) + '")');
    await MalTay.send(expr);
    expr = expr2h('(register! 0x"' + maltay3.address.substring(2) + '")');
    await MalTay.send(expr);

    // Check if registered correctly
    expr = expr2h('(getregistered 1)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x04000014' + maltay2.address.substring(2).toLowerCase());

    expr = expr2h('(getregistered 2)');
    resp = await MalTay.call(expr);
    expect(resp).toBe('0x04000014' + maltay3.address.substring(2).toLowerCase());

    // def! & store in maltay2
    expr = expr2h('(def! quad (fn* (a) (mul (add a a) 2) ) )');
    await maltay2.send(expr);

    // use function directly in maltay2
    resp = await maltay2.call(expr2h('(_quad 5)'));
    expect(resp).toBe('0x0a91000400000014');

    // def! & store in maltay3
    expr = expr2h('(def! fib (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(_fib (sub n 1)) (_fib (sub n 2)) ) )))');
    await maltay3.send(expr);

    // use function directly in maltay3
    resp = await maltay3.call(expr2h('(_fib 8)'));
    expect(resp).toBe('0x0a91000400000015');
    
    // test functions through MalTay root contract
    resp = await MalTay.call(expr2h('(_fib (_quad 2) )'));
    expect(resp).toBe('0x0a91000400000015');

    resp = await MalTay.call('0x44444440');
    expect(parseInt(resp, 16)).toBe(2);
}, 20000);

it('test logs', async function() {
    const resp = await MalTay.getStoredFunctions();
    expect(resp.length).toBe(8);
});

it('test evm functions', async function() {
    let resp;
    resp = await MalTay.call(expr2h('(gas)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');

    resp = await MalTay.call(expr2h('(address)'));
    expect(resp).toBe('0x0a910014' + MalTay.address.substring(2));

    resp = await MalTay.call(expr2h('(callvalue)'));
    expect(resp).toBe('0x0a910020' + '0'.padStart(64, '0'));
})

