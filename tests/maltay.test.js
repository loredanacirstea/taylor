require('../src/extensions.js');
const { getTaylor, getMalBackend } = require('./setup/fixtures.js');
const { decode, encode, expr2h, b2h, u2b, expr2s } = require('../src/index.js');
const BN = require('bn.js');
const ethers = require('ethers');

let MalTay;
let MalB = getMalBackend();

beforeAll(() => {
  return getTaylor().then(t => {
    MalTay = t;
    console.log('****MalTay', MalTay.address);
    return MalTay.init();
  }).then(() => MalTay.watch());
});

afterAll(() => {
    if (MalTay) MalTay.unwatch();
    return;
});

const evenHex = value => value.length % 2 === 1 ? '0' + value : value;
const toHex = value => '0x' + evenHex(Math.floor(value).toString(16));
const bnToHex = value => '0x' + evenHex(value.toString(16));
const getRandomInt = max => Math.floor(Math.random() * Math.floor(max));

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

    resp = await MalTay.call('(concat "0x11" "0x22")');
    expect(resp).toBe('0x1122');

    resp = await MalTay.call('(concat "0x11aaaabb" "0x221111ccdd")');
    expect(resp).toBe('0x11aaaabb221111ccdd');
});

it('test bytes contig', async function () {
    let resp;

    resp = await MalTay.call('(contig 4 "0x22")');
    expect(resp).toBe('0x22222222');

    resp = await MalTay.call('(contig 2 "0x221111ccdd")');
    expect(resp).toBe('0x221111ccdd221111ccdd');
});

it('test recursive', async function () {
    let resp;
    
    await MalTay.sendAndWait('(def! recursivefn (fn* (n) (if (gt n 5) n (recursivefn (add n 1)) ) ) )');
    
    resp = await MalTay.call('(recursivefn 2)');
    expect(resp).toBe(6);
});

it('test recursive fibonacci', async function () {
    await MalTay.sendAndWait('(def! fibonacci (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(fibonacci (sub n 1)) (fibonacci (sub n 2)) ) )))');

    resp = await MalTay.call('(fibonacci 1)');
    expect(resp).toBe(1);

    resp = await MalTay.call('(fibonacci 2)');
    expect(resp).toBe(1);

    resp = await MalTay.call('(fibonacci 3)');
    expect(resp).toBe(2);

    resp = await MalTay.call('(fibonacci 8)');
    expect(resp).toBe(21);
});

it.skip('test reduce recursive', async function () {
    let expr, resp;

    await MalTay.sendAndWait('(def! myfunc3 (fn* (a b) (add a b)) )');
    await MalTay.sendAndWait('(def! reduce (fn* (f init xs) (if (empty? xs) init (reduce f (f init (first xs)) (rest xs)))))');

    resp = await MalTay.call('(reduce myfunc3 (list 5 8 2) 0 )');
    expect(resp).toBe(15);
});

it('test registration & executing from root contract', async function () {
    let expr, resp;

    const maltay2 = await getTaylor();
    const maltay3 = await getTaylor();

    // Register
    // TODO: type integer
    await MalTay.sendAndWait('(register! "0x' + maltay2.address.substring(2) + '")');
    await MalTay.sendAndWait('(register! "0x' + maltay3.address.substring(2) + '")');

    // Check if registered correctly
    resp = await MalTay.call('(getregistered 1)');
    expect(resp).toBe(maltay2.address.toLowerCase());

    resp = await MalTay.call('(getregistered 2)');
    expect(resp).toBe(maltay3.address.toLowerCase());

    // def! & store in maltay2
    await maltay2.sendAndWait('(def! quad (fn* (a) (mul (add a a) 2) ) )');

    // use function directly in maltay2
    resp = await maltay2.call('(quad 5)');
    expect(resp).toBe(20);

    // def! & store in maltay3
    await maltay3.sendAndWait('(def! fib (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(fib (sub n 1)) (fib (sub n 2)) ) )))');

    // use function directly in maltay3
    resp = await maltay3.call('(fib 8)');
    expect(resp).toBe(21);
    
    // test functions through MalTay root contract
    await MalTay.init();
    resp = await MalTay.call('(fib (quad 2) )');
    expect(resp).toBe(21);

    resp = await MalTay.call_raw('0x44444440');
    expect(parseInt(resp, 16)).toBe(2);
}, 30000);

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
    
    const account = await MalTay.provider.getSigner(5).getAddress();
    resp = await MalTay.call_raw(expr2h(`(balance "${account}")`));
    expect(resp).toBe('0x0a9100200000000000000000000000000000000000000000000000056bc75e2d63100000');

    resp = await MalTay.call_raw(expr2h('(codesize)'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');
    expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);

    resp = await MalTay.call_raw(expr2h('(extcodesize "0x' + MalTay.address.substring(2) + '")'));
    expect(resp.substring(0, 10)).toBe('0x0a910020');
    expect(parseInt(resp.substring(10), 16)).toBeGreaterThan(0);
})

it('test compact dynamic length storage', async function () {
    let resp, receipt;
    const count = 36;
    const maxLength = 80;
    
    const exampleArrLengths = [...new Array(count)].map(() => getRandomInt(maxLength))
    const exampleArr = exampleArrLengths.map(len => '0x' + [...new Array(len)].map((_, i) => (i+1).toString(16).padStart(2, '0')).join(''))

    for (item of exampleArr) {
        receipt = await MalTay.send(`(save! "${item}" "0x04000000" )`);
        receipt =  await receipt.wait();
    }

    for (index in exampleArr) {
        resp = await MalTay.call(`(getfrom "0x04000000" ${index})`);
        expect(resp).toEqual(exampleArr[index]);
    }
}, 50000);

describe.each([
    [6, 36, '0x04000006'],
    [8, 36, '0x04000008'],
    [8, 36, null],
])('test compact static storage: (%s)(%s)(%s)', (size, count, typeid) => {
    let resp;

    const exampleArr = [...new Array(count)].map(() => '0x' + [...new Array(size)].map((_, i) => (i+1).toString(16).padStart(2, '0')).join(''))

    test(`test static storage `, async () => {
        let gasaverage = 0;

        for (item of exampleArr) {
            const expr = typeid ? `(save! "${item}")` : `(save! "${item}" "${typeid}" )`;
            receipt = await MalTay.send(expr);
            receipt =  await receipt.wait();
            gasaverage += parseInt(receipt.gasUsed._hex.substring(2), 16);
        }

        typeid = typeid || ('0x04' + size.toString(16).padStart(6, '0'));

        for (index in exampleArr) {
            resp = await MalTay.call(`(getfrom "${typeid}" ${index})`);
            expect(resp).toEqual(exampleArr[index]);
        }
        console.log(`static storage gasaverage: (${size})(${count})`, gasaverage / exampleArr.length);
    }, 50000);
}, 50000);

it.skip('test structs abi func', async function() {
    let resp;

    // 0x0400000424000001
    resp = await MalTay.send('(defstruct! abifunc (list "0x04000014" "0x04000004") )');
    resp = await resp.wait()
    console.log(resp.logs[0].topics)

    resp = await MalTay.call(`(getfrom "0x20000000" 0)`);
    expect(resp).toEqual('0x1100000204000004040000140400000404000004');

    await MalTay.send('(save! (struct abifunc (map save! (list "0xCFF8dc8A5e2Af7fcc6BE124d3C91FA50186A8c96" "0x6bdbf8e6") )) )');

    resp = await MalTay.call(`(getfrom "0x04000014" 0)`);
    expect(resp).toEqual('0xCFF8dc8A5e2Af7fcc6BE124d3C91FA50186A8c96'.toLowerCase());

    resp = await MalTay.call(`(getfrom "0x04000004" 0)`);
    expect(resp).toEqual('0x6bdbf8e6');

    resp = await MalTay.call(`(getfrom "0x24000001" 0)`);
    expect(resp).toEqual({sig: 0x24000001, 0: 0, 1: 0});

    // 2
    await MalTay.send('(save! (struct abifunc (map save! (list "0xCFF8dc8A5e2Af7fcc6BE124d3C91FA50186A8c96" "0x5b8bfc2d") )) )');

    resp = await MalTay.call(`(getfrom "0x04000014" 1)`);
    expect(resp).toEqual('0xCFF8dc8A5e2Af7fcc6BE124d3C91FA50186A8c96'.toLowerCase());

    resp = await MalTay.call(`(getfrom "0x04000004" 1)`);
    expect(resp).toEqual('0x5b8bfc2d');

    resp = await MalTay.call(`(getfrom "0x24000001" 1)`);
    expect(resp).toEqual({sig: 0x24000001, 0: 1, 1: 1});

    resp = await MalTay.call(`(rcall "0x24000001" 1 "0x00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006")`);
    expect(resp).toEqual('0x000000000000000000000000000000000000000000000000000000000000000a');
});

describe('test arrays & structs', function () {
    let scount = 0;

    it('test structs', async function() {
        let resp;
    
        // 0x0400000424000001
        await MalTay.send('(defstruct! astruct (list "0x0a910004" "0x0a910004") )');
    
        resp = await MalTay.call(`(getfrom Struct 0)`);
        expect(resp).toEqual('0x11000002040000040a910004040000040a910004');
        
        await MalTay.send('(struct! "astruct" (list 4 6) )');
    
        resp = await MalTay.call(`(getfrom Uint 0)`);
        expect(resp).toEqual(4);
    
        resp = await MalTay.call(`(getfrom Uint 1)`);
        expect(resp).toEqual(6);
    
        resp = await MalTay.call(`(list-struct (getfrom "astruct" 0))`);
        expect(resp).toEqual([4, 6]);
    });

    it('test array simple', async function() {
        let resp;
    
        resp = await MalTay.call('(array 4 8 9)');
        expect(resp).toEqual([4, 8, 9]);
    
        await MalTay.send('(save! (array 4 8 9) )');
    
        resp = await MalTay.call(`(getfrom "0x400000030a910004" 0)`);
        expect(resp).toEqual([4, 8, 9]);
    });

    it('struct: astruct2 with u32 array', async function() {
        await MalTay.send('(defstruct! astruct2 (list "0x400000030a910004" "0x400000030a910004") )');
        scount += 1;

        resp = await MalTay.call(`(getfrom Struct ${scount})`);
        expect(resp).toEqual('0x1100000204000008400000030a91000404000008400000030a910004');

        await MalTay.send('(struct! "astruct2" (list (array 6 8 11) (array 2 7 9)) )');

        resp = await MalTay.call(`(getfrom "0x400000030a910004" 1)`);
        expect(resp).toEqual([6, 8, 11]);

        resp = await MalTay.call(`(getfrom "0x400000030a910004" 2)`);
        expect(resp).toEqual([2, 7, 9]);

        resp = await MalTay.call(`(list-struct (getfrom "astruct2" 0))`);
        expect(resp).toEqual([[6, 8, 11], [2, 7, 9]]);
    });
    
    it('struct: anotherstruct with bytes20 array', async function() {
        await MalTay.send('(defstruct! anotherstruct (list "0x04000003" "0x4000000604000014") )');
        scount += 1;
    
        resp = await MalTay.call(`(getfrom Struct ${scount})`);
        expect(resp).toEqual('0x110000020400000404000003040000084000000604000014');

        let arr = [
            '0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222', '0x3333333333333333333333333333333333333333', '0x4444444444444444444444444444444444444444', '0x5555555555555555555555555555555555555555', '0x6666666666666666666666666666666666666666'
        ];
        let arrstr = `"${arr.join('" "')}"`;
        
        resp = await MalTay.call(`(array ${arrstr})`);
        expect(resp).toEqual(arr);

        await MalTay.send(`(struct! "anotherstruct" (list "0x334455" (array ${arrstr} ) ))`);

        resp = await MalTay.call(`(getfrom "0x04000003" 0)`);
        expect(resp).toEqual("0x334455");

        resp = await MalTay.call(`(getfrom "0x4000000604000014" 0)`);
        expect(resp).toEqual(arr);

        resp = await MalTay.call(`(list-struct (getfrom "anotherstruct" 0))`);
        expect(resp).toEqual(['0x334455', arr]);

        // 2
        arr = [
            '0x7777777777777777777777777777777777777777', '0x8888888888888888888888888888888888888888', '0x9999999999999999999999999999999999999999',
            '0x4444444444444444444444444444444444444444', '0x5555555555555555555555555555555555555555', '0x6666666666666666666666666666666666666666'
        ];
        arrstr = `"${arr.join('" "')}"`;

        await MalTay.send(`(struct! "anotherstruct" (list "0x667788" (array ${arrstr} ) ))`);

        resp = await MalTay.call(`(getfrom "0x04000003" 1)`);
        expect(resp).toEqual("0x667788");

        resp = await MalTay.call(`(getfrom "0x4000000604000014" 1)`);
        expect(resp).toEqual(arr);

        resp = await MalTay.call(`(list-struct (getfrom "anotherstruct" 1))`);
        expect(resp).toEqual(['0x667788', arr]);
    });

    it('test multi dimensional array in struct', async function() {
        let resp;
        let array_2_3_expr = '(array (array 2 3 4) (array 5 6 7))'
        let array_2_4_3_expr = `(array (array (array 2 3 4) (array 2 3 4) (array 5 6 7) (array 5 6 7)) (array (array 2 3 4) (array 2 3 4) (array 5 6 7) (array 5 6 7)) )`
        let array_2_3 = [[2, 3, 4], [5, 6, 7]];
        let array_2_4_3 = [
            [[ 2, 3, 4 ], [ 2, 3, 4 ], [ 5, 6, 7 ], [ 5, 6, 7 ]],
            [[ 2, 3, 4 ], [ 2, 3, 4 ], [ 5, 6, 7 ], [ 5, 6, 7 ]],
        ]
        
        resp = await MalTay.call(array_2_3_expr);
        expect(resp).toEqual(array_2_3);
        
        resp = await MalTay.call(array_2_4_3_expr);
        expect(resp).toEqual(array_2_4_3);

        await MalTay.send('(defstruct! struct3 (list "0x40000002400000030a910004" "0x4000000240000004400000030a910004") )');

        await MalTay.send(`(struct! "struct3" (list 
            ${array_2_3_expr}
            ${array_2_4_3_expr}
        ))`);

        resp = await MalTay.call(`(getfrom "0x40000002400000030a910004" 0)`);
        expect(resp).toEqual(array_2_3);

        resp = await MalTay.call(`(getfrom "0x4000000240000004400000030a910004" 0)`);
        expect(resp).toEqual(array_2_4_3);

        resp = await MalTay.call(`(list-struct (getfrom "struct3" 0))`);
        expect(resp).toEqual([array_2_3, array_2_4_3]);
    });
});

it('test ownership & costs', async function() {
    let expr, resp;
    let sender = MalTay.provider.getSigner(3);
    let owner_pre_balance = await MalTay.signer.getBalance();
    let sender_pre_balance = await sender.getBalance();

    expr = '(defstruct! astruct_pay (list "0x0a910004" "0x0a910004") )'
    let cost = (await MalTay.estimateGas(expr)).toNumber() * 2;

    resp = await MalTay.send(expr, {value: cost}, sender);
    let txprice = resp.gasPrice;
    resp = await resp.wait();
    txprice = resp.gasUsed.mul(txprice);

    let sender_post_balance = await sender.getBalance();
    let owner_post_balance = await MalTay.signer.getBalance();

    expect(owner_post_balance.sub(owner_pre_balance).toNumber()).toBe(cost);
    expect(sender_pre_balance.sub(sender_post_balance).toNumber()).toBe(txprice.toNumber() + cost);

    // TODO - expect failure if value to small
});

describe('test dynamic storage', function () {
    it('test dynamic array storage', async function() {
        let resp;

        await MalTay.send('(savedyn! (array 4 8 9) )');

        await MalTay.send('(savedyn! (array "0x11223344556677889910" "0x11121314151617181920") )');

        await MalTay.send('(savedyn! (array 1 2 3) )');

        resp = await MalTay.call(`(getdyn "0x400000000a910004" 0)`);
        expect(resp).toEqual([4, 8, 9]);

        resp = await MalTay.call(`(getdyn "0x400000000400000a" 0)`);
        expect(resp).toEqual(['0x11223344556677889910', '0x11121314151617181920']);

        resp = await MalTay.call(`(getdyn "0x400000000a910004" 1)`);
        expect(resp).toEqual([1, 2, 3]);

        await MalTay.send('(push! "0x400000000a910004" 0 22 )');
        await MalTay.send('(push! "0x400000000a910004" 0 23 )');
        await MalTay.send('(push! "0x400000000a910004" 0 24 )');
        await MalTay.send('(push! "0x400000000a910004" 0 25 )');
        await MalTay.send('(push! "0x400000000a910004" 0 26 )');
        await MalTay.send('(push! "0x400000000a910004" 0 27 )');
        await MalTay.send('(push! "0x400000000a910004" 0 28 )');
        await MalTay.send('(push! "0x400000000a910004" 0 29 )');
        await MalTay.send('(push! "0x400000000a910004" 0 30 )');
        await MalTay.send('(push! "0x400000000a910004" 0 31 )');
        await MalTay.send('(push! "0x400000000a910004" 0 32 )');

        resp = await MalTay.call(`(getdyn "0x400000000a910004" 0)`);
        expect(resp).toEqual([4, 8, 9, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);

        await MalTay.send('(push! "0x400000000a910004" 1 4 )');
        await MalTay.send('(push! "0x400000000a910004" 1 5 )');
        resp = await MalTay.call(`(getdyn "0x400000000a910004" 1)`);
        expect(resp).toEqual([1, 2, 3, 4, 5]);

        
        await MalTay.send('(push! "0x400000000400000a" 0 "0x21222324252627282930" )');
        await MalTay.send('(push! "0x400000000400000a" 0 "0x31323334353637383940" )');
        resp = await MalTay.call(`(getdyn "0x400000000400000a" 0)`);
        expect(resp).toEqual(['0x11223344556677889910', '0x11121314151617181920', '0x21222324252627282930', '0x31323334353637383940']);
    }, 10000);
});

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

    it('test empty', async function() {
        let resp;
    
        resp = await instance.call('(empty? (list))');
        expect(resp).toBe(true);
        resp = await instance.call('(empty? (list 1))');
        expect(resp).toBe(false);
        resp = await instance.call('(empty? (list 0))');
        expect(resp).toBe(false);
    });
    
    it('test bool checks', async function() {
        let resp;
        resp = await instance.call('(true? true)');
        expect(resp).toBe(true);
        resp = await instance.call('(true? false)');
        expect(resp).toBe(false);
    
        resp = await instance.call('(false? false)');
        expect(resp).toBe(true);
        resp = await instance.call('(false? true)');
        expect(resp).toBe(false);
    });

    it('test nil', async function() {
        let resp;
    
        resp = await instance.call('(nil? (list))');
        expect(resp).toBe(true);

        resp = await instance.call('(nil? (list 1))');
        expect(resp).toBe(false);

        resp = await instance.call('(nil? false)');
        expect(resp).toBe(true);

        resp = await instance.call('(nil? true)');
        expect(resp).toBe(false);

        resp = await instance.call('(nil? "0x")');
        expect(resp).toBe(true);

        resp = await instance.call('(nil? "0x22")');
        expect(resp).toBe(false);
    });
    
    it('test list functions', async function() {
        let resp;
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

        await instance.sendAndWait('(def! func1 (fn* (a b) (add a b)))');

        if (backendname === 'chain') {
            resp = await instance.call_raw('0x44444442' + name.hexEncode().padStart(64, '0'));
            expect(resp).toBe('0x8c0000289000000201000000000000000100000000000001');
        }

        resp = await instance.call('(func1 2 3)');
        expect(resp).toBe(5);

        resp = await instance.call('(func1 (add (add (sub 7 2) 1) 41) (add 2 3)))');
        expect(resp).toBe(52);

        if (backendname === 'chain') {
            resp = await instance.getFns();
            expect(resp.length).toBe(1);
            expect(resp[0].name).toBe('func1');
        }
    }, 10000);

    it('test used stored fn 2', async function () {
        let expr, resp;
        let name = 'func2'
    
        await instance.sendAndWait('(def! func2 (fn* (a b) (add (add (sub a b) a) b)))');
        
        if (backendname === 'chain') {
            resp = await instance.call_raw('0x44444442' + name.hexEncode().padStart(64, '0'));
            expect(resp).toBe(expr2h('(fn* (a b) (add (add (sub a b) a) b))'));
        }

        resp = await instance.call('(func2 5 3)');
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

        resp = await instance.call('(map iszero (list 5 0 2))');
        expect(resp).toEqual([0, 1, 0]);
    
        await instance.sendAndWait('(def! myfunc (fn* (a) (mul (add a 1) 3)))');
        
        resp = await instance.call('(map myfunc (list 5 8 2))');
        expect(resp).toEqual([18, 27, 9]);

        if (backendname === 'chain') {
            resp = await instance.getFns();
            expect(resp.length).toBe(3);
            expect(resp[2].name).toBe('myfunc');
        }
    });

    it('test reduce', async function () {
        let resp;

        resp = await instance.call('(reduce add (list) 2)');
        expect(resp).toBe(2);
    
        resp = await instance.call('(reduce add (list 5 8 2) 0)');
        expect(resp).toBe(15);
    
        resp = await instance.call('(reduce sub (list 45 8 2) 100)');
        expect(resp).toBe(45);
        
        await instance.sendAndWait('(def! myfunc2 (fn* (a b) (add a b)) )');
    
        resp = await instance.call('(myfunc2 4 5)'); 
        expect(resp).toBe(9);
    
        resp = await instance.call('(myfunc2 0 5)');
        expect(resp).toBe(5);
      
        resp = await instance.call('(reduce myfunc2 (list 5 8 2) 0)');
        expect(resp).toBe(15);
    });

    it('test byte-like', async function() {
        resp = await instance.call('(list "0x2233" "hello" "0x44556677" "someword")');
        expect(resp).toEqual(['0x2233', 'hello', '0x44556677', 'someword']);
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
        resp = await instance.call('(byte 2 "0x11445566")');
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
    
    test(`keccak256`, async () => {
        let hash;
        resp = await instance.call('(keccak256 2 12)');
        hash = ethers.utils.keccak256(ethers.utils.arrayify('0x000000020000000c'));
        expect(resp).toBe(hash);

        resp = await instance.call('(keccak256 "0x223344")');
        hash = ethers.utils.keccak256(ethers.utils.arrayify('0x223344'));
        expect(resp).toBe(hash);

        resp = await instance.call('(keccak256 "0x0a910004" "0x0a910004" 7)');
        hash = ethers.utils.keccak256(ethers.utils.arrayify('0x0a9100040a91000400000007'));
        expect(resp).toBe(hash);
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
        resp = await instance.call('(balance "0xfffFd05c2b12cfE3c74464531f88349e159785ea")');
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
        resp = await instance.call('(extcodesize "0x' + MalTay.signer._address.substring(2) + '")');
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

    test('multi store! & sload', async () => {
        await instance.send('(store! 12 66)');
        resp = await instance.call('(sload 12 "0x0a910004")');
        expect(resp).toBe(66);

        if (backendname === 'chain') {
            await instance.send('(store! 12 66)');
            resp = await instance.call('(sload 12 "0x04000004")');
            expect(resp).toBe('0x00000042');
        }

        await instance.send('(store! 20 "0x11223344556677889910111213141516171819202122232425262728293031323334353637383940")');
        resp = await instance.call('(sload 20 "0x04000028")');
        expect(resp).toBe('0x11223344556677889910111213141516171819202122232425262728293031323334353637383940');
    });

    it('test revert', async function() {
        if (backendname === 'chain') {
            await expect(instance.send('(revert "Error1")')).rejects.toThrow('revert');
        } else {
            // TODO properly catch this with jest
            // await expect(instance.send('(revert "Error1")')).rejects.toThrow();
        }
    })

    it('test return', async function() {
        let resp;
        
        resp = await instance.call('(return 44)');
        expect(parseInt(resp)).toBe(44);
        resp = await instance.call('(return "0x2233")');
        expect(resp).toBe('0x2233');
    })

    // TBD
    // stop
    // pc
    // pop
    // mload
    // mstore
    // mstore8
    // msize

    it('test logs', async function() {
        if (backendname === 'chain') {
            const resp = await instance.getFns();
            expect(resp.length).toBe(4);
        }
    });
});

describe('test mapping', function () {
    it('value: simple type', async function() {
        let resp;
        
        await MalTay.send('(defmap! "balances" Address Uint)');
        resp = await MalTay.call('(getfrom Map 0)');
        expect(resp).toBe(expr2h('(Address)') + expr2h('(Uint)').substring(2))

        await MalTay.send('(mapset! "balances" (caller) 3)');
        resp = await MalTay.call('(mapget "balances" (caller))');
        expect(resp).toBe(3);
    });

    it('value: struct type', async function() {
        let resp;

        await MalTay.send('(defstruct! SomeStruct (list Uint Bool Uint))');
        await MalTay.send('(defmap! "structbyaddr" Address "SomeStruct")');

        // TODO: (getsig Voter)
        resp = await MalTay.call('(getfrom Map 1)');
        expect(resp.substring(0, 18)).toBe(expr2h('(Address)'));

        await MalTay.send('(mapset! "structbyaddr" (caller) (struct! "SomeStruct" (list 3 true 66) ))');

        resp = await MalTay.call(`(list-struct (getfrom "SomeStruct" 0))`);
        expect(resp).toEqual([3, 1, 66]);

        resp = await MalTay.call(`(list-struct (mapget "structbyaddr" (caller)))`);
        expect(resp).toEqual([3, 1, 66]);
    });
});

it('ballot contract', async function() {

    const init = `(list 
        ; weight, voted, delegate, vote (proposal index)
        (defstruct! Voter (list Uint Bool Address Uint))
        
        ; name, voteCount
        (defstruct! Proposal (list String32 Uint) )
    
        (defmap! "voters" Address "Voter")
        
        ; (name! chairperson (save! (caller)))
        (store! 0 (caller))
    )`;
    
    const init2 = `(list
        (struct! "Proposal" (list "proposal1" 0))
        (struct! "Proposal" (list "proposal2" 0))
        (struct! "Proposal" (list "proposal3" 0))
    )`;

    const checkinit = `(list
        (list-struct (getfrom "Proposal" 0))
        (list-struct (getfrom "Proposal" 1))
        (list-struct (getfrom "Proposal" 2))
    )`

    let giveRightToVote = `(def! giveRightToVote! (fn* (voterAddress)
        (if (eq (caller) (sload 0 Address))
            (if (nil? (mapget "voters" voterAddress))
                (mapset! "voters" voterAddress (struct! "Voter" (list 1 0 0 0)))
                (revert "The voter already voted.")
            )
            (revert "Only chairperson can give right to vote.")
        )
    ))`

    const vote = `(def! vote (fn* (proposalIndex)
        (let sender (mapget voters (caller)
            (if (or (eq 0 (nth 0 sender)) (nth 1 sender))
                (revert "Has no right to vote")
                (list
                    (mapset! voters (caller) 
                        (struct! Voter (list sender.0 true sender.2 proposalIndex))
                    )
                    (let proposal (getfrom Proposal proposalIndex)
                        (modify! (set proposal.1 (add proposal.1 sender.1)))
                    )
                )
            )
        )
    ))`

    await MalTay.send(init);
    await MalTay.send(init2);

    resp = await MalTay.call(checkinit);
    expect(resp[0]).toEqual(['proposal1', 0]);
    expect(resp[1]).toEqual(['proposal2', 0]);
    expect(resp[2]).toEqual(['proposal3', 0]);

    resp = await MalTay.call('(eq (caller) (sload 0 Address))');
    expect(resp).toBe(1);

    resp = await MalTay.call('(nil? (mapget "voters" "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51"))');
    expect(resp).toBe(true);

    resp = await MalTay.call('(nil? (list-struct (mapget "voters" "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51")))');
    expect(resp).toBe(true);

    await MalTay.sendAndWait(giveRightToVote);
    await MalTay.send('(giveRightToVote! "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51")');

    resp = await MalTay.call('(nil? (mapget "voters" "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51"))');
    expect(resp).toBe(false);

    resp = await MalTay.call('(nil? (list-struct (mapget "voters" "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51")))');
    expect(resp).toBe(false);

    resp = await MalTay.call('(list-struct (mapget "voters" "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51"))')
    expect(resp).toEqual([1, 0, '0x0000000000000000000000000000000000000000', 0]);
});
