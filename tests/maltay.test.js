require('../src/extensions.js');
const { getTaylor } = require('./setup/fixtures.js');
const { decode, encode, expr2h, b2h, u2b, expr2s } = require('../src/index.js');
const mal = require('../src/mal_extension.js');

let MalTay;

beforeAll(() => {
  return getTaylor().then(t => {
    MalTay = t;
    console.log('****MalTay', MalTay.address);
  });
});

const evenHex = value => value.length % 2 === 1 ? '0' + value : value;
const toHex = value => '0x' + evenHex(Math.floor(value).toString(16));
const bnToHex = value => '0x' + evenHex(value.toString(16));

it('js_backend', () => {
    let resp;

    resp = mal.re('(add (add 4 7) 10)');
    expect(resp._hex).toBe(toHex(21));

    resp = mal.re('(div (sub (mul (add 4 7) 10) 44) 5)');
    expect(resp._hex).toBe(toHex( ((4 + 7) * 10 - 44) / 5 ));

    resp = mal.re('(mod 10 3)');
    expect(resp._hex).toBe(toHex(1));

    resp = mal.re('(exp 2 8)');
    expect(resp._hex).toBe(toHex(Math.pow(2, 8)));

    resp = mal.re('(lt 10 3)');
    expect(resp._hex).toBe(toHex(0));

    resp = mal.re('(gt 10 3)');
    expect(resp._hex).toBe(toHex(1));

    resp = mal.re('(eq 10 10)');
    expect(resp._hex).toBe(toHex(1));

    resp = mal.re('(iszero 0)');
    expect(resp._hex).toBe(toHex(1));
    
    resp = mal.re('(not (not 12))');
    expect(resp._hex).toBe(toHex(12));
    
    resp = mal.re('(and (iszero 0) (gt 9 7))');
    expect(resp._hex).toBe(toHex(1));

    resp = mal.re('(or (iszero 5) (gt 9 7))');
    expect(resp._hex).toBe(toHex(1));

    resp = mal.re('(xor (iszero 0) (gt 9 7))');
    expect(resp._hex).toBe(toHex(0));

    // resp = mal.re('(shl 2 12)');
    // expect(resp._hex).toBe(toHex(0x30));

    // resp = mal.re('(shr 2 12)');
    // expect(resp._hex).toBe(toHex(3));
});

it('test expr2h', async function () {
    
    expect(expr2h('(add 4 7)')).toBe('0x900000020a910004000000040a91000400000007');
    expect(expr2h('(add (add (sub 7 2) 1) 41)')).toBe('0x9000000290000002900000040a910004000000070a910004000000020a910004000000010a91000400000029');

    expect(expr2h('(list 5 4 (add 6 2) 3 (sub 6 1))')).toBe('0xa800003e0a910004000000050a91000400000004900000020a910004000000060a910004000000020a91000400000003900000040a910004000000060a91000400000001');
});

it('test encoding & decoding', function () {
    expect(encode([{type: 'list'}], [[5, 4, 8, 3, 5]])).toEqual('0x110000050a910004000000050a910004000000040a910004000000080a910004000000030a91000400000005');
    expect(decode('0x110000050a910004000000050a910004000000040a910004000000080a910004000000030a91000400000005')).toEqual([5, 4, 8, 3, 5]);
    expect(decode(encode([{type: 'list'}], [[5, 4, 8, 3, 5]]))).toEqual([5, 4, 8, 3, 5]);
    
    expect(encode([{type: 'uint', size: 4}], [7])).toEqual('0x0a91000400000007');
    expect(decode('0x0a91000400000007')).toEqual(7);
    expect(decode(encode([{type: 'uint', size: 4}], [7]))).toEqual(7);

    expect(encode([{type: 'bytes'}], ['0x1122'])).toEqual('0x040000021122');
    expect(decode('0x040000021122')).toEqual('0x1122');
    expect(decode(encode([{type: 'bytes'}], ['0x1122']))).toEqual('0x1122');

    expect(encode([{type: 'bytes'}], ['0x11aaaabb221111ccdd'])).toEqual('0x0400000911aaaabb221111ccdd');
    expect(decode('0x0400000911aaaabb221111ccdd')).toEqual('0x11aaaabb221111ccdd');
    expect(decode(encode([{type: 'bytes'}], ['0x11aaaabb221111ccdd']))).toEqual('0x11aaaabb221111ccdd');

    expect(encode([{type: 'bool'}], [true])).toEqual('0x0a800001');
    expect(decode('0x0a800001')).toEqual(true);
    expect(decode(encode([{type: 'bool'}], [true]))).toEqual(true);

    expect(encode([{type: 'bool'}], [false])).toEqual('0x0a800000');
    expect(decode('0x0a800000')).toEqual(false);
    expect(decode(encode([{type: 'bool'}], [false]))).toEqual(false);
});

it('test list', async function () {
    let resp;

    resp = await MalTay.call('(list 5 4 8 3 5)');
    expect(resp).toEqual([5, 4, 8, 3, 5]);

    resp = await MalTay.call('(list 5 4 (add 6 5) 3 (sub 6 1))');
    expect(resp).toEqual([5, 4, 11, 3, 5]);
});

it('test lambda', async function () {
    let resp;

    // TODO: return function type?
    // expr = '(fn* (a) a)';
    // resp = await MalTay.call(expr);
    // expect(resp).toBe(expr);

    resp = await MalTay.call('( (fn* (a) a) 7)');
    expect(resp).toBe(7);

    resp = await MalTay.call('( (fn* (a) (add a 1)) 10)');
    expect(resp).toBe(11);

    resp = await MalTay.call('( (fn* (a b) (add a b)) 2 3)');
    expect(resp).toBe(5);

    resp = await MalTay.call('( (fn* (a b) (add a b)) (add (add (sub 7 2) 1) 41) (add 2 3))');
    expect(resp).toBe(52);

    resp = await MalTay.call('( (fn* (a b) (add (mul a b ) b)) 2 3)');
    expect(resp).toBe(9);
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
    
    resp = await MalTay.call_raw(expr);
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
    
    resp = await MalTay.call_raw(expr);
    expect(resp).toBe('0x0a91000400000034');
});

it('test use stored fn 1', async function () {
    let resp;
    let name = 'func1'

    await MalTay.send('(def! func1 (fn* (a b) (add a b)))');
    resp = await MalTay.call_raw('0x44444442' + name.hexEncode().padStart(64, '0'));
    expect(resp).toBe('0x8c0000289000000201000000000000000100000000000001');
    
    resp = await MalTay.call('(_func1 2 3)');
    expect(resp).toBe(5);

    resp = await MalTay.call('(_func1 (add (add (sub 7 2) 1) 41) (add 2 3)))');
    expect(resp).toBe(52);

    resp = await MalTay.getStoredFunctions();
    expect(resp.length).toBe(1);
    expect(resp[0].name).toBe('func1');
});

it('test used stored fn 2', async function () {
    let expr, resp;
    let name = 'func2'

    await MalTay.send('(def! func2 (fn* (a b) (add (add (sub a b) a) b)))');

    resp = await MalTay.call_raw('0x44444442' + name.hexEncode().padStart(64, '0'));
    expect(resp).toBe(expr2h('(fn* (a b) (add (add (sub a b) a) b))'));

    resp = await MalTay.call('(_func2 5 3)');
    expect(resp).toBe(10);

    resp = await MalTay.getStoredFunctions();
    expect(resp.length).toBe(2);
    expect(resp[0].name).toBe('func1');
    expect(resp[1].name).toBe('func2');
});

it('test if', async function () {
    let resp;

    resp = await MalTay.call('(if (gt 4 1) 7 8)');
    expect(resp).toBe(7);

    resp = await MalTay.call('(if (gt 4 9) 7 8)');
    expect(resp).toBe(8);

    resp = await MalTay.call('(if (gt 4 1) (add (sub 33 2) 1) (add (sub 7 2) 1))');
    expect(resp).toBe(32);

    resp = await MalTay.call('(if (gt 4 9) (add (sub 33 2) 1) (add (sub 7 2) 1))');
    expect(resp).toBe(6);
});

it.skip('test if with lambda', async function () {
    let resp;

    resp = await MalTay.call('(if (gt 4 1) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))');
    expect(resp).toBe(5);

    resp = await MalTay.call('(if (gt 4 9) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))');
    expect(resp).toBe(6);
});

it('test bytes concat', async function () {
    let resp;

    resp = await MalTay.call('(concat 0x"11" 0x"22")');
    expect(resp).toBe('0x1122');

    resp = await MalTay.call('(concat 0x"11aaaabb" 0x"221111ccdd")');
    expect(resp).toBe('0x11aaaabb221111ccdd');
});

it('test bytes contig', async function () {
    let resp;

    resp = await MalTay.call('(contig 4 0x"22")');
    expect(resp).toBe('0x22222222');

    resp = await MalTay.call('(contig 2 0x"221111ccdd")');
    expect(resp).toBe('0x221111ccdd221111ccdd');
});

it('test map', async function () {
    let resp;

    await MalTay.send('(def! myfunc (fn* (a) (mul (add a 1) 3)))');
    
    resp = await MalTay.call('(map _myfunc (list 5 8 2))');
    expect(resp).toEqual([18, 27, 9]);
    
    resp = await MalTay.getStoredFunctions();
    expect(resp.length).toBe(3);
    expect(resp[2].name).toBe('myfunc');
});

it('test funcs', async function() {
    let resp;

    resp = await MalTay.call('(empty? (list))');
    expect(resp).toBe(true);
    resp = await MalTay.call('(empty? (list 1))');
    expect(resp).toBe(false);
    resp = await MalTay.call('(empty? (list 0))');
    expect(resp).toBe(false);

    resp = await MalTay.call('(true? true)');
    expect(resp).toBe(true);
    resp = await MalTay.call('(true? false)');
    expect(resp).toBe(false);

    resp = await MalTay.call('(false? false)');
    expect(resp).toBe(true);
    resp = await MalTay.call('(false? true)');
    expect(resp).toBe(false);
    
    resp = await MalTay.call('(first (list 5 3 7))');
    expect(resp).toBe(5);

    resp = await MalTay.call('(rest (list 5 3 7))');
    expect(resp).toEqual([3, 7]);

    resp = await MalTay.call('(nth (list 5 3 7) 2)');
    expect(resp).toBe(7);
});

it('test reduce', async function () {
    let resp;
    
    await MalTay.send('(def! myfunc2 (fn* (a b) (add a b)) )');

    resp = await MalTay.call('(_myfunc2 4 5)'); 
    expect(resp).toBe(9);

    resp = await MalTay.call('(_myfunc2 0 5)');
    expect(resp).toBe(5);
  
    resp = await MalTay.call('(reduce _myfunc2 (list 5 8 2) 0)');
    expect(resp).toBe(15);
});

it('test recursive', async function () {
    let resp;
    
    await MalTay.send('(def! recursive (fn* (n) (if (gt n 5) n (_recursive (add n 1)) ) ) )');
    
    resp = await MalTay.call('(_recursive 2)');
    expect(resp).toBe(6);
});

it('test recursive fibonacci', async function () {
    await MalTay.send('(def! fibonacci (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(_fibonacci (sub n 1)) (_fibonacci (sub n 2)) ) )))');

    resp = await MalTay.call('(_fibonacci 1)');
    expect(resp).toBe(1);

    resp = await MalTay.call('(_fibonacci 2)');
    expect(resp).toBe(1);

    resp = await MalTay.call('(_fibonacci 3)');
    expect(resp).toBe(2);

    resp = await MalTay.call('(_fibonacci 8)');
    expect(resp).toBe(21);
});

it('test reduce recursive', async function () {
    let expr, resp;

    await MalTay.send('(def! myfunc3 (fn* (a b) (add a b)) )');
    await MalTay.send('(def! reduce (fn* (f init xs) (if (empty? xs) init (reduce f (f init (first xs)) (rest xs)))))');

    resp = await MalTay.call('(reduce _myfunc3 (list 5 8 2) 0 )');
    expect(resp).toBe(15);
});

it('test registration & executing from root contract', async function () {
    let expr, resp;

    const maltay2 = await getTaylor();
    const maltay3 = await getTaylor();

    // Register
    // TODO: type integer
    await MalTay.send('(register! 0x"' + maltay2.address.substring(2) + '")');
    await MalTay.send('(register! 0x"' + maltay3.address.substring(2) + '")');

    // Check if registered correctly
    resp = await MalTay.call('(getregistered 1)');
    expect(resp).toBe(maltay2.address.toLowerCase());

    resp = await MalTay.call('(getregistered 2)');
    expect(resp).toBe(maltay3.address.toLowerCase());

    // def! & store in maltay2
    await maltay2.send('(def! quad (fn* (a) (mul (add a a) 2) ) )');

    // use function directly in maltay2
    resp = await maltay2.call('(_quad 5)');
    expect(resp).toBe(20);

    // def! & store in maltay3
    await maltay3.send('(def! fib (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(_fib (sub n 1)) (_fib (sub n 2)) ) )))');

    // use function directly in maltay3
    resp = await maltay3.call('(_fib 8)');
    expect(resp).toBe(21);
    
    // test functions through MalTay root contract
    resp = await MalTay.call('(_fib (_quad 2) )');
    expect(resp).toBe(21);

    resp = await MalTay.call_raw('0x44444440');
    expect(parseInt(resp, 16)).toBe(2);
}, 20000);

it('test logs', async function() {
    const resp = await MalTay.getStoredFunctions();
    expect(resp.length).toBe(8);
});

it('test printer', async function () {
    let expr;
    
    expr = expr2h('(add 4 7)');
    expect(expr2h(expr2s(expr))).toBe(expr);

    expr = expr2h('(if (gt 4 1) 7 8)');
    expect(expr2h(expr2s(expr))).toBe(expr);

    expr = expr2h('(if (gt 4 9) (add (sub 33 2) 1) (add (sub 7 2) 1))');
    expect(expr2h(expr2s(expr))).toBe(expr);
});

it('test evm functions', async function() {
    let resp;

    resp = await MalTay.call('(sub 9 3)');
    expect(resp).toBe(6);

    resp = await MalTay.call('(div 9 3)');
    expect(resp).toBe(3);

    resp = await MalTay.call('(sdiv 12 3)');
    expect(resp).toBe(4);

    resp = await MalTay.call('(mod 12 3)');
    expect(resp).toBe(0);

    resp = await MalTay.call('(smod 12 3)');
    expect(resp).toBe(0);

    resp = await MalTay.call('(exp 2 8)');
    expect(resp).toBe(256);

    // resp = await MalTay.call('(not (not 12))');
    // expect(resp).toBe('0x0a9100040000000c');

    // TODO bool?
    resp = await MalTay.call('(lt 3 7)');
    expect(resp).toBe(1);

    resp = await MalTay.call('(gt 3 7)');
    expect(resp).toBe(0);

    resp = await MalTay.call('(slt 3 7)');
    expect(resp).toBe(1);

    resp = await MalTay.call('(sgt 7 7)');
    expect(resp).toBe(0);

    resp = await MalTay.call('(eq 7 7)');
    expect(resp).toBe(1);

    resp = await MalTay.call('(iszero 4)');
    expect(resp).toBe(0);

    resp = await MalTay.call('(and (iszero 0) (gt 9 7))');
    expect(resp).toBe(1);

    resp = await MalTay.call('(or (iszero 5) (gt 9 7))');
    expect(resp).toBe(1);

    resp = await MalTay.call('(xor (iszero 0) (gt 9 7))');
    expect(resp).toBe(0);

    // resp = await MalTay.call('(byte 2 0x"11445566")');
    // expect(resp).toBe('0x0a91000400000044');

    resp = await MalTay.call('(shl 2 12)');
    expect(resp).toBe(0x30);

    resp = await MalTay.call('(shr 2 12)');
    expect(resp).toBe(3);

    resp = await MalTay.call('(sar 2 12)');
    expect(resp).toBe(3);

    resp = await MalTay.call('(addmod 10, 5, 4)');
    expect(resp).toBe(3);

    resp = await MalTay.call('(mulmod 10, 5, 4)');
    expect(resp).toBe(2);

    resp = await MalTay.call('(signextend 2 12)');
    expect(resp).toBe(0xc);

    // resp = await MalTay.call('(keccak256 2 12)');
    // expect(resp).toBe('0x0a91000400000030');

    // TODO calls

    resp = await MalTay.call_raw(expr2h('(gas)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');

    resp = await MalTay.call('(address)');
    expect(bnToHex(resp)).toBe(MalTay.address);

    resp = await MalTay.call_raw(expr2h('(balance 0x"fffFd05c2b12cfE3c74464531f88349e159785ea")'));
    expect(resp).toBe('0x0a9100200000000000000000000000000000000000000000000000056bc75e2d63100000');

    resp = await MalTay.call('(caller)');
    expect(bnToHex(resp)).toBe(MalTay.signer._address.toLowerCase());

    resp = await MalTay.call('(callvalue)');
    expect(resp.toNumber()).toBe(0);

    // TODO calldataload
    
    resp = await MalTay.call('(calldatasize)');
    expect(resp.toNumber()).toBe(4);

    resp = await MalTay.call_raw(expr2h('(codesize)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');
    expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);

    // resp = await MalTay.call('(extcodesize 0x"' + MalTay.signer._address.substring(2) + '")');
    // expect(resp.substring(0, 10)).toBe('0x0a910020');
    // expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);

    // TODO extcodecopy
    // returndatasize
    // create
    // create2
    // logs
    // chainid

    resp = await MalTay.call('(origin)');
    expect(bnToHex(resp)).toBe(MalTay.signer._address.toLowerCase());

    // TODO fixme
    // resp = await MalTay.call_raw(expr2h('(blockhash 1)'));
    // expect(resp.substring(0, 10)).toBe('0x04000020');
    // expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);

    resp = await MalTay.call_raw(expr2h('(coinbase)'));
    expect(resp).toBe('0x0a9100140000000000000000000000000000000000000000');

    resp = await MalTay.call_raw(expr2h('(timestamp)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');
    expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);

    resp = await MalTay.call_raw(expr2h('(number)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');
    expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);

    resp = await MalTay.call_raw(expr2h('(difficulty)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');

    resp = await MalTay.call_raw(expr2h('(gaslimit)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');
    expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);
})

