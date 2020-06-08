require('../src/extensions.js');
const { getTaylor, getMalBackend } = require('./setup/fixtures.js');
const { decode, encode, expr2h, b2h, u2b, expr2s } = require('../src/index.js');
const BN = require('bn.js');

let MalTay;
let MalB = getMalBackend();

beforeAll(() => {
  return getTaylor().then(t => {
    MalTay = t;
    console.log('****MalTay', MalTay.address);
  });
});

const evenHex = value => value.length % 2 === 1 ? '0' + value : value;
const toHex = value => '0x' + evenHex(Math.floor(value).toString(16));
const bnToHex = value => '0x' + evenHex(value.toString(16));

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

    resp = await MalTay.call('(sdiv 12 3)');
    expect(resp).toBe(4);

    resp = await MalTay.call('(smod 12 3)');
    expect(resp).toBe(0);

    resp = await MalTay.call('(slt 3 7)');
    expect(resp).toBe(1);

    resp = await MalTay.call('(sgt 7 7)');
    expect(resp).toBe(0);

    resp = await MalTay.call('(sar 2 12)');
    expect(resp).toBe(3);

    resp = await MalTay.call('(addmod 10, 5, 4)');
    expect(resp).toBe(3);

    resp = await MalTay.call('(mulmod 10, 5, 4)');
    expect(resp).toBe(2);

    resp = await MalTay.call('(signextend 2 12)');
    expect(resp).toBe(0xc);

    // TODO calls

    resp = await MalTay.call_raw(expr2h('(balance 0x"fffFd05c2b12cfE3c74464531f88349e159785ea")'));
    expect(resp).toBe('0x0a9100200000000000000000000000000000000000000000000000056bc75e2d63100000');

    resp = await MalTay.call_raw(expr2h('(codesize)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');
    expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);

    resp = await MalTay.call_raw(expr2h('(extcodesize 0x"' + MalTay.address.substring(2) + '")'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');
    expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);
})

describe.each([
    ['chain', MalTay],
    ['mal', MalB],
])(' (%s)', (backendname, instance) => {
    if (backendname === 'chain') {
        beforeAll(() => {
            return getTaylor().then(t => {
                instance = t;
              console.log('****MalTay', MalTay.address);
            });
        });
    }

    test(`list`, async () => {
        resp = await instance.call('(list 5 4 8 3 5)');
        expect(resp).toEqual([5, 4, 8, 3, 5]);

        resp = await instance.call('(list 5 4 (add 6 5) 3 (sub 6 1))');
        expect(resp).toEqual([5, 4, 11, 3, 5]);
    });

    test(`lambda`, async () => {
        // TODO: return function type?
        // expr = '(fn* (a) a)';
        // resp = await instance.call(expr);
        // expect(resp).toBe(expr);

        resp = await instance.call('( (fn* (a) a) 7)');
        expect(resp).toBe(7);

        resp = await instance.call('( (fn* (a) (add a 1)) 10)');
        expect(resp).toBe(11);

        resp = await instance.call('( (fn* (a b) (add a b)) 2 3)');
        expect(resp).toBe(5);

        resp = await instance.call('( (fn* (a b) (add a b)) (add (add (sub 7 2) 1) 41) (add 2 3))');
        expect(resp).toBe(52);

        resp = await instance.call('( (fn* (a b) (add (mul a b ) b)) 2 3)');
        expect(resp).toBe(9);
    });

    it('test if', async function () {
        let resp;

        // resp = await instance.call('(if true 7 8)');
        // expect(resp).toBe(7);

        // resp = await instance.call('(if false 7 8)');
        // expect(resp).toBe(8);
    
        resp = await instance.call('(if (gt 4 1) 7 8)');
        expect(resp).toBe(7);

        resp = await instance.call('(if (lt 9 4) 7 8)');
        expect(resp).toBe(8);
    
        resp = await instance.call('(if (gt 4 9) 7 8)');
        expect(resp).toBe(8);
    
        resp = await instance.call('(if (gt 4 1) (add (sub 33 2) 1) (add (sub 7 2) 1))');
        expect(resp).toBe(32);
    
        resp = await instance.call('(if (gt 4 9) (add (sub 33 2) 1) (add (sub 7 2) 1))');
        expect(resp).toBe(6);
    });

    it('test funcs', async function() {
        let resp;
    
        resp = await instance.call('(empty? (list))');
        expect(resp).toBe(true);
        resp = await instance.call('(empty? (list 1))');
        expect(resp).toBe(false);
        resp = await instance.call('(empty? (list 0))');
        expect(resp).toBe(false);
    
        resp = await instance.call('(true? true)');
        expect(resp).toBe(true);
        resp = await instance.call('(true? false)');
        expect(resp).toBe(false);
    
        resp = await instance.call('(false? false)');
        expect(resp).toBe(true);
        resp = await instance.call('(false? true)');
        expect(resp).toBe(false);
        
        resp = await instance.call('(first (list 5 3 7))');
        expect(resp).toBe(5);
    
        resp = await instance.call('(rest (list 5 3 7))');
        expect(resp).toEqual([3, 7]);
    
        resp = await instance.call('(nth (list 5 3 7) 2)');
        expect(resp).toBe(7);
    });

    it('test use stored fn 1', async function () {
        let resp;
        let name = 'func1'
    
        await instance.send('(def! func1 (fn* (a b) (add a b)))');
        
        if (backendname === 'chain') {
            resp = await instance.call_raw('0x44444442' + name.hexEncode().padStart(64, '0'));
            expect(resp).toBe('0x8c0000289000000201000000000000000100000000000001');
        }
        
        resp = await instance.call('(_func1 2 3)');
        expect(resp).toBe(5);
    
        resp = await instance.call('(_func1 (add (add (sub 7 2) 1) 41) (add 2 3)))');
        expect(resp).toBe(52);

        if (backendname === 'chain') {
            resp = await instance.getFns();
            expect(resp.length).toBe(1);
            expect(resp[0].name).toBe('func1');
        }
    });

    it('test used stored fn 2', async function () {
        let expr, resp;
        let name = 'func2'
    
        await instance.send('(def! func2 (fn* (a b) (add (add (sub a b) a) b)))');
        
        if (backendname === 'chain') {
            resp = await instance.call_raw('0x44444442' + name.hexEncode().padStart(64, '0'));
            expect(resp).toBe(expr2h('(fn* (a b) (add (add (sub a b) a) b))'));
        }

        resp = await instance.call('(_func2 5 3)');
        expect(resp).toBe(10);
        
        if (backendname === 'chain') {
            resp = await instance.getFns();
            expect(resp.length).toBe(2);
            expect(resp[0].name).toBe('func1');
            expect(resp[1].name).toBe('func2');
        }
    });

    it('test map', async function () {
        let resp;
    
        await instance.send('(def! myfunc (fn* (a) (mul (add a 1) 3)))');
        
        resp = await instance.call('(map _myfunc (list 5 8 2))');
        expect(resp).toEqual([18, 27, 9]);

        if (backendname === 'chain') {
            resp = await instance.getFns();
            expect(resp.length).toBe(3);
            expect(resp[2].name).toBe('myfunc');
        }
    });

    test(`add`, async () => {
        resp = await instance.call('(add 9 3)');
        expect(resp).toBe(12);
    });
    
    test(`sub`, async () => {
        resp = await instance.call('(sub 9 3)');
        expect(resp).toBe(6);
    });

    test(`div`, async () => {
        resp = await instance.call('(div 9 3)');
        expect(resp).toBe(3);
    });

    test.skip(`sdiv`, async () => {
        resp = await instance.call('(sdiv 12 3)');
        expect(resp).toBe(4);
    });

    test(`mod`, async () => {
        resp = await instance.call('(mod 12 3)');
        expect(resp).toBe(0);
        resp = await instance.call('(mod 10 3)');
        expect(resp).toBe(1);
    });

    test.skip(`smod`, async () => {
        resp = await instance.call('(smod 12 3)');
        expect(resp).toBe(0);
    });

    test(`exp`, async () => {
        resp = await instance.call('(exp 2 8)');
        expect(resp).toBe(256);
    });

    test.skip(`not`, async () => {
        resp = await instance.call('(not (not 12))');
        expect(resp).toBe(12);
    });

    test(`lt`, async () => {
        resp = await instance.call('(lt 3 7)');
        expect(resp).toBe(1);

        resp = await instance.call('(lt 3 2)');
        expect(resp).toBe(0);
    });
    
    test(`gt`, async () => {
        resp = await instance.call('(gt 3 7)');
        expect(resp).toBe(0);

        resp = await instance.call('(gt 3 2)');
        expect(resp).toBe(1);
    });
    
    test.skip(`slt`, async () => {
        resp = await instance.call('(slt 3 7)');
        expect(resp).toBe(1);
    });
    
    test.skip(`sgt`, async () => {
        resp = await instance.call('(sgt 7 7)');
        expect(resp).toBe(0);
    });
    
    test(`eq`, async () => {
        resp = await instance.call('(eq 7 7)');
        expect(resp).toBe(1);
    });
    
    test(`iszero`, async () => {
        resp = await instance.call('(iszero 4)');
        expect(resp).toBe(0);
    });
    
    test(`and`, async () => {
        resp = await instance.call('(and (iszero 0) (gt 9 7))');
        expect(resp).toBe(1);
    });
    
    test(`or`, async () => {
        resp = await instance.call('(or (iszero 5) (gt 9 7))');
        expect(resp).toBe(1);
    });
    
    test(`xor`, async () => {
        resp = await instance.call('(xor (iszero 0) (gt 9 7))');
        expect(resp).toBe(0);
    });
    
    test.skip(`byte`, async () => {
        resp = await instance.call('(byte 2 0x"11445566")');
        expect(resp).toBe('0x44');
    });
    
    test(`shl`, async () => {
        resp = await instance.call('(shl 2 12)');
        expect(resp).toBe(0x30);
    });
    
    test(`shr`, async () => {
        resp = await instance.call('(shr 2 12)');
        expect(resp).toBe(3);
    });
    
    test.skip(`sar`, async () => {
        resp = await instance.call('(sar 2 12)');
        expect(resp).toBe(3);
    });
    
    test.skip(`addmod`, async () => {
        resp = await instance.call('(addmod 10, 5, 4)');
        expect(resp).toBe(3);
    });
    
    test.skip(`mulmod`, async () => {
        resp = await instance.call('(mulmod 10, 5, 4)');
        expect(resp).toBe(2);
    });
    
    test.skip(`signextend`, async () => {
        resp = await instance.call('(signextend 2 12)');
        expect(resp).toBe(0xc);
    });

    test(`math`, async () => {
        resp = await instance.call('(add (add 4 7) 10)');
        expect(resp).toBe(21);

        resp = await instance.call('(div (sub (mul (add 4 7) 10) 44) 5)');
        expect(resp).toBe(Math.floor(((4 + 7) * 10 - 44) / 5 ));
    });
    
    test.skip(`keccak256`, async () => {
        resp = await instance.call('(keccak256 2 12)');
        expect(resp).toBe('0x0a91000400000030');
    });

    test(`gas`, async () => {
        resp = await instance.call('(gas)', {gasLimit: 200000});
        expect(resp.toNumber()).toBeGreaterThan(170000);
    });

    test(`address`, async () => {
        resp = await instance.call('(address)');
        expect(resp).toBe(instance.address);
    });

    test.skip(`balance`, async () => {
        resp = await instance.call('(balance 0x"fffFd05c2b12cfE3c74464531f88349e159785ea")');
        expect(resp.toNumber()).toBe(100);
    });

    test.skip(`selfbalance`, async () => {
        resp = await instance.call('(selfbalance)');
        expect(resp.toNumber()).toBe(100);
    });

    test(`caller`, async () => {
        resp = await instance.call('(caller)', {from: instance.signer._address});
        expect(resp.toLowerCase()).toBe(instance.signer._address.toLowerCase());
    });

    test(`callvalue`, async () => {
        resp = await instance.call('(callvalue)', {value: 20000});
        expect(resp).toBe(20000);
    });

    test.skip(`calldataload`, async () => {
        resp = await instance.call('(calldataload 10)');
    });

    test(`calldatasize`, async () => {
        resp = await instance.call('(calldatasize)');
        expect(resp).toBe(4);
    });

    test.skip(`calldatacopy`, async () => {
        resp = await instance.call('(calldatacopy 3 7 8)');
    });

    test(`codesize`, async () => {
        resp = await instance.call('(codesize)');
        expect(resp).toBeGreaterThan(4);
    });

    test.skip(`codecopy`, async () => {
        resp = await instance.call('(codecopy 3 7 8)');
    });

    test.skip(`extcodesize`, async () => {
        resp = await instance.call('(extcodesize 0x"' + MalTay.signer._address.substring(2) + '")');
        expect(resp).toBeGreaterThan(4);
    });

    test.skip(`extcodecopy`, async () => {
        resp = await instance.call('(extcodecopy 3 7 8)');
    });

    test.skip(`returndatasize`, async () => {
        resp = await instance.call('(returndatasize)');
    });

    test.skip(`returndatacopy`, async () => {
        resp = await instance.call('(returndatacopy 3 7 8)');
    });

    test.skip(`extcodehash`, async () => {
        resp = await instance.call('(extcodehash "0x000000")');
    });

    test.skip(`create`, async () => {
        resp = await instance.call('(create 100000 64 64)');
    });

    test.skip(`create2`, async () => {
        resp = await instance.call('(create 100000 64 64 88)');
    });

    test.skip(`call`, async () => {
        resp = await instance.call('(call )');
    });

    test.skip(`callcode`, async () => {
        resp = await instance.call('(call )');
    });

    test.skip(`delegatecall`, async () => {
        resp = await instance.call('(call )');
    });

    test.skip(`staticcall`, async () => {
        resp = await instance.call('(call )');
    });

    test.skip(`log0, log1, log2, log3, log4`, async () => {
        resp = await instance.call('(log0 )');
    });

    test.skip(`chainid`, async () => {
        resp = await instance.call('(chainid)');
        expect(resp).toBe(3);
    });

    test(`origin`, async () => {
        resp = await instance.call('(origin)', {from: instance.signer._address});
        expect(resp.toLowerCase()).toBe(instance.signer._address.toLowerCase());
    });

    // TODO: implement on chain
    test.skip(`gasprice`, async () => {
        resp = await instance.call('(gasprice)', {gasPrice: 40});
        expect(resp).toBe(40);
    });

    test.skip(`blockhash`, async () => {
        resp = await instance.call('(blockhash)');
        // expect(bnToHex(resp)).toBe(instance.signer._address.toLowerCase());
    });

    test(`coinbase`, async () => {
        resp = await instance.call('(coinbase)');
        expect(resp.toLowerCase()).toBe('0x0000000000000000000000000000000000000000');
    });

    test(`timestamp`, async () => {
        resp = await instance.call('(timestamp)');
        expect(resp.toNumber()).toBeGreaterThan(1000000);
    });

    test(`number`, async () => {
        resp = await instance.call('(number)');
        expect(resp).toBeGreaterThan(0);
    });

    test(`difficulty`, async () => {
        resp = await instance.call('(difficulty)');
        // expect(BN.isBN(resp)).toBe(true);
    });

    test(`gaslimit`, async () => {
        resp = await instance.call('(gaslimit)',  {gasLimit: 200000});
        expect(resp.toNumber()).toBe(200000);
    });

    // TBD
    // stop
    // pc
    // pop
    // mload
    // mstore
    // mstore8
    // sload
    // sstore
    // msize
    // return
    // revert

    it('test logs', async function() {
        if (backendname === 'chain') {
            const resp = await instance.getFns();
            expect(resp.length).toBe(3);
        }
    });
});

