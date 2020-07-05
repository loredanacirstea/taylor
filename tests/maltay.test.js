require('../src/extensions.js');
const { deployTaylor, getMalBackend } = require('./setup/fixtures.js');
const { decode, encode, expr2h, b2h, u2b, expr2s } = require('../src/index.js');
const BN = require('bn.js');
const ethers = require('ethers');

let MalTay;
let MalB = getMalBackend();

beforeAll(() => {
  return deployTaylor().then(t => {
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

it('test registration & executing from root contract', async function () {
    let expr, resp;

    const maltay2 = await deployTaylor();
    const maltay3 = await deployTaylor();

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
    
    const account = await MalTay.provider.getSigner(8).getAddress();
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
        await MalTay.sendAndWait('(defstruct! astruct (list "0x0a910004" "0x0a910004") )');
    
        resp = await MalTay.call(`(getfrom Struct 0)`);
        expect(resp).toEqual('0x11000002040000040a910004040000040a910004');

        resp = await MalTay.call(`(defstruct astruct)`);
        expect(resp).toEqual(['0x0a910004', '0x0a910004']);
        
        await MalTay.send('(struct! astruct (list 4 6) )');

        resp = await MalTay.call(`(refs-struct (getfrom astruct 0))`);
        expect(resp).toEqual([0, 1]);
    
        resp = await MalTay.call(`(getfrom Uint 0)`);
        expect(resp).toEqual(4);
    
        resp = await MalTay.call(`(getfrom Uint 1)`);
        expect(resp).toEqual(6);
    
        resp = await MalTay.call(`(list-struct (getfrom astruct 0))`);
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
        await MalTay.sendAndWait('(defstruct! astruct2 (list "0x400000030a910004" "0x400000030a910004") )');
        scount += 1;

        resp = await MalTay.call(`(getfrom Struct ${scount})`);
        expect(resp).toEqual('0x1100000204000008400000030a91000404000008400000030a910004');

        await MalTay.send('(struct! astruct2 (list (array 6 8 11) (array 2 7 9)) )');

        resp = await MalTay.call(`(getfrom "0x400000030a910004" 1)`);
        expect(resp).toEqual([6, 8, 11]);

        resp = await MalTay.call(`(getfrom "0x400000030a910004" 2)`);
        expect(resp).toEqual([2, 7, 9]);

        resp = await MalTay.call(`(list-struct (getfrom astruct2 0))`);
        expect(resp).toEqual([[6, 8, 11], [2, 7, 9]]);
    });
    
    it('struct: anotherstruct with bytes20 array', async function() {
        await MalTay.sendAndWait('(defstruct! anotherstruct (list "0x04000003" "0x4000000604000014") )');
        scount += 1;
    
        resp = await MalTay.call(`(getfrom Struct ${scount})`);
        expect(resp).toEqual('0x110000020400000404000003040000084000000604000014');

        let arr = [
            '0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222', '0x3333333333333333333333333333333333333333', '0x4444444444444444444444444444444444444444', '0x5555555555555555555555555555555555555555', '0x6666666666666666666666666666666666666666'
        ];
        let arrstr = `"${arr.join('" "')}"`;
        
        resp = await MalTay.call(`(array ${arrstr})`);
        expect(resp).toEqual(arr);

        await MalTay.send(`(struct! anotherstruct (list "0x334455" (array ${arrstr} ) ))`);

        resp = await MalTay.call(`(getfrom "0x04000003" 0)`);
        expect(resp).toEqual("0x334455");

        resp = await MalTay.call(`(getfrom "0x4000000604000014" 0)`);
        expect(resp).toEqual(arr);

        resp = await MalTay.call(`(list-struct (getfrom anotherstruct 0))`);
        expect(resp).toEqual(['0x334455', arr]);

        // 2
        arr = [
            '0x7777777777777777777777777777777777777777', '0x8888888888888888888888888888888888888888', '0x9999999999999999999999999999999999999999',
            '0x4444444444444444444444444444444444444444', '0x5555555555555555555555555555555555555555', '0x6666666666666666666666666666666666666666'
        ];
        arrstr = `"${arr.join('" "')}"`;

        await MalTay.send(`(struct! anotherstruct (list "0x667788" (array ${arrstr} ) ))`);

        resp = await MalTay.call(`(getfrom "0x04000003" 1)`);
        expect(resp).toEqual("0x667788");

        resp = await MalTay.call(`(getfrom "0x4000000604000014" 1)`);
        expect(resp).toEqual(arr);

        resp = await MalTay.call(`(list-struct (getfrom anotherstruct 1))`);
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

        await MalTay.sendAndWait('(defstruct! struct3 (list "0x40000002400000030a910004" "0x4000000240000004400000030a910004") )');

        await MalTay.send(`(struct! struct3 (list 
            ${array_2_3_expr}
            ${array_2_4_3_expr}
        ))`);

        resp = await MalTay.call(`(getfrom "0x40000002400000030a910004" 0)`);
        expect(resp).toEqual(array_2_3);

        resp = await MalTay.call(`(getfrom "0x4000000240000004400000030a910004" 0)`);
        expect(resp).toEqual(array_2_4_3);

        resp = await MalTay.call(`(list-struct (getfrom struct3 0))`);
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
            return deployTaylor().then(t => {
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
        // resp = await instance.call('(fn* (a) a)');
        // expect(resp).toBe('(fn* (a) a)');

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

        resp = await MalTay.call(`
            ((fn* (a b) (add a b))
            (add (add (sub 7 2) 1) 41)
            (add 2 3) )
        `);
        expect(resp).toBe(52);
    });

    it('test if', async function () {
        let resp;

        resp = await instance.call('(if true 7 8)');
        expect(resp).toBe(7);

        resp = await instance.call('(if false 7 8)');
        expect(resp).toBe(8);
    
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

    it('test if with lambda', async function () {
        let resp;
    
        resp = await MalTay.call(`(if (gt 4 1) 
            ( (fn* (a b) (add a b)) 2 3 )
            (add (sub 7 2) 1)
        )`);
        expect(resp).toBe(5);
    
        resp = await MalTay.call(`(if (gt 4 9)
            ( (fn* (a b) (add a b)) 2 3 )
            (add (sub 7 2) 1)
        )`);
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

    it('test list?', async function() {
        let resp;
    
        resp = await instance.call('(list? (list))');
        expect(resp).toBe(true);

        resp = await instance.call('(list? (list 1 5))');
        expect(resp).toBe(true);

        resp = await instance.call('(list? 4)');
        expect(resp).toBe(false);

        // TODO on js side there if no way now to differentiate between
        // a list and array if the internal types are the same
        if (backendname === 'chain') {
            resp = await instance.call('(list? (array 1 5))');
            expect(resp).toBe(false);
        }
    });

    if (backendname === 'chain') {
        it('test array?', async function() {
            let resp;

            resp = await instance.call('(array? (array))');
            expect(resp).toBe(true);

            resp = await instance.call('(array? (array 1 5))');
            expect(resp).toBe(true);

            resp = await instance.call('(array? 4)');
            expect(resp).toBe(false);

            resp = await instance.call('(array? (list 1 5))');
            expect(resp).toBe(false);
        });
    }

    it('test sequential?', async function() {
        let resp;
    
        resp = await instance.call('(sequential? (list))');
        expect(resp).toBe(true);

        resp = await instance.call('(sequential? (array))');
        expect(resp).toBe(true);

        resp = await instance.call('(sequential? (list 1 5))');
        expect(resp).toBe(true);

        resp = await instance.call('(sequential? (array 1 5))');
        expect(resp).toBe(true);

        resp = await instance.call('(sequential? 4)');
        expect(resp).toBe(false);
    });
    
    it('test iterator functions', async function() {
        let resp;
        resp = await instance.call('(first (list 5 3 7))');
        expect(resp).toBe(5);
    
        resp = await instance.call('(nth (list 5 3 7) 2)');
        expect(resp).toBe(7);

        resp = await instance.call('(rest (list 5 3 7))');
        expect(resp).toEqual([3, 7]);

        resp = await instance.call('(first (array 5 3 7))');
        expect(resp).toBe(5);
    
        resp = await instance.call('(nth (array 5 3 7) 2)');
        expect(resp).toBe(7);

        resp = await instance.call('(nth (array (array 5 3 7) (array 8 4 2) (array 9 11 12)) 1)');
        expect(resp).toEqual([8, 4, 2]);

        resp = await instance.call('(rest (array 5 3 7))');
        expect(resp).toEqual([3, 7]);
    });

    it('test let* & nested scopes', async function() {
        resp = await instance.call('(let* (c 2) c)');
        expect(resp).toBe(2);

        resp = await instance.call('(let* (a 4 b (add a 2) c (mul b 3)) (sub c b))');
        expect(resp).toBe(12);

        resp = await instance.call(`(let* (c 2 a (add c 4))
            ((fn* (d e) (add d e)) a c)
        )`);
        expect(resp).toBe(8);

        resp = await instance.call(`( (fn* (d e)
            (let* (a 6) (add (add a d) e) )
        ) 2 1
        )`);
        expect(resp).toBe(9);
    });

    it('test let* & lambda', async function() {
        resp = await instance.call(`(let* (
                somelambda (fn* (a) (add a 1))
            )
            (somelambda 3)
        )`);
        expect(resp).toBe(4);

        resp = await instance.call(`(let* (
            somelambda (fn* (a) (add a 1))
            )
            (map somelambda (array 3 4))
        )`);
        expect(resp).toEqual([4, 5]);
    });

    it('test use stored fn 1', async function () {
        let resp;
        let name = 'func1'

        await instance.sendAndWait('(def! func1 (fn* (a b) (add a b)))');

        if (backendname === 'chain') {
            resp = await instance.call_raw('0x44444442' + name.hexEncode().padStart(64, '0'));
            expect(resp).toBe('0x8c00005011000002010000000000000001000000000000019000000201000000000000000100000000000001');
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
    }, 10000);

    it('test map', async function () {
        let resp;

        resp = await instance.call('(map iszero (list 5 0 2))');
        expect(resp).toEqual([0, 1, 0]);

        resp = await instance.call('(map iszero (array 5 0 2))');
        expect(resp).toEqual([0, 1, 0]);
    
        await instance.sendAndWait('(def! myfunc (fn* (a) (mul (add a 1) 3)))');
        
        resp = await instance.call('(map myfunc (list 5 8 2))');
        expect(resp).toEqual([18, 27, 9]);

        resp = await instance.call(`(map
            (fn* (a) (mul (add a 1) 3))
            (list 5 8 2)
        )`);
        expect(resp).toEqual([18, 27, 9]);

        resp = await instance.call(`(map
            (fn* (a) (mul (add a 1) 3))
            (array 5 8 2)
        )`);
        expect(resp).toEqual([18, 27, 9]);

        resp = await instance.call(`(let* (
                somelambda (fn* (a) (add a 1))
            )
            (map somelambda (list 5 8 2) )
        )`);
        expect(resp).toEqual([6, 9, 3]);

        resp = await instance.call(`(let* (
                somelambda (fn* (a) (mul (add a 1) 3))
            )
            (map somelambda (list 5 8 2) )
        )`);
        expect(resp).toEqual([18, 27, 9]);

        resp = await instance.call(`(let* (
                somelambda (fn* (a) (mul (add a 1) 3))
            )
            (map somelambda (array 5 8 2) )
        )`);
        expect(resp).toEqual([18, 27, 9]);

        if (backendname === 'chain') {
            resp = await instance.getFns();
            expect(resp.length).toBe(3);
            expect(resp[2].name).toBe('myfunc');
        }
    }, 10000);

    it('test reduce', async function () {
        let resp;

        resp = await instance.call('(reduce add (list) 2)');
        expect(resp).toBe(2);
    
        resp = await instance.call('(reduce add (list 5 8 2) 0)');
        expect(resp).toBe(15);
    
        resp = await instance.call('(reduce sub (list 45 8 2) 100)');
        expect(resp).toBe(45);

        resp = await instance.call('(reduce sub (array 45 8 2) 100)');
        expect(resp).toBe(45);
        
        await instance.sendAndWait('(def! myfunc2 (fn* (a b) (add a b)) )');
    
        resp = await instance.call('(myfunc2 4 5)'); 
        expect(resp).toBe(9);
    
        resp = await instance.call('(myfunc2 0 5)');
        expect(resp).toBe(5);
      
        resp = await instance.call('(reduce myfunc2 (list 5 8 2) 0)');
        expect(resp).toBe(15);

        resp = await instance.call('(reduce myfunc2 (array 5 8 2) 0)');
        expect(resp).toBe(15);

        resp = await instance.call(`(reduce
            (fn* (a b) (add a b))
            (list 5 8 2)
            0
        )`);
        expect(resp).toBe(15);

        resp = await instance.call(`(let* (
                somelambda (fn* (a b) (add a b))
            )
            (reduce somelambda (list 5 8 2) 0)
        )`);
        expect(resp).toEqual(15);

        resp = await instance.call(`(let* (
                reduce (fn* (f xs init) (if (empty? xs) init (reduce f (rest xs) (f init (first xs)) )))
                somelambda (fn* (a b) (add a b))
            )
            (reduce somelambda (list 5 8 2) 0)
        )`);
        expect(resp).toEqual(15);
        
        // TODO fixme
        await instance.sendAndWait('(def! reduce2 (fn* (f xs init) (if (empty? xs) init (reduce f (rest xs) (f init (first xs)) ))))');

        // resp = await instance.call(`(let* (
        //         somelambda (fn* (a b) (add a b))
        //     )
        //     (reduce2 somelambda (list 5 8 2) 0)
        // )`);
        // expect(resp).toEqual(15);
    });

    it('test reduce recursive', async function () {
        let resp;
        await instance.sendAndWait('(def! myfunc3 (fn* (a b) (add a b)) )');
        resp = await instance.call('(reduce myfunc3 (list 5 8 2) 0 )');
        expect(resp).toBe(15);
    });

    it('test recursive', async function () {
        let resp;
        
        await instance.sendAndWait('(def! recursivefn (fn* (n) (if (gt n 5) n (recursivefn (add n 1)) ) ) )');
        
        resp = await instance.call('(recursivefn 2)');
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

    it('test recursive lambda', async function () {
        let resp;

        resp = await instance.call(`(let* 
            (recursivefn 
                (fn* (n) (if (gt n 5) n (recursivefn (add n 1)) ) )
            )
            (recursivefn 2)
        )`);
        expect(resp).toBe(6);

        resp = await instance.call(`(let* 
            (localfibo 
                (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(localfibo (sub n 1)) (localfibo (sub n 2)) ) ))
            )
            (localfibo 8)
        )`);
        expect(resp).toBe(21);
    });

    it('test byte-like', async function() {
        resp = await instance.call('(list "0x2233" "hello" "0x44556677" "someword")');
        expect(resp).toEqual(['0x2233', 'hello', '0x44556677', 'someword']);
    });

    it('test range', async function() {
        resp = await instance.call('(range 1 5 1)');
        expect(resp).toEqual([1, 2, 3, 4, 5]);

        resp = await instance.call('(range 3 19 3)');
        expect(resp).toEqual([3, 6, 9, 12, 15, 18]);

        resp = await instance.call('(range 89 168 20)');
        expect(resp).toEqual([89, 109, 129, 149]);

        resp = await instance.call('(range 1 1 1)');
        expect(resp).toEqual([1]);

        resp = await instance.call('(range 0 0 1)');
        expect(resp).toEqual([0]);

        // TODO: support negative step
        // resp = await instance.call('(range 5 1 -1)');
        // expect(resp).toEqual([5, 4, 3, 2, 1]);
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
            expect(resp.length).toBe(7);
        }
    });
});

it('test push', async function() {
    let resp;
    resp = await MalTay.call(`(push (array 4 5 6) 20)`);
    expect(resp).toEqual([4, 5, 6, 20]);

    resp = await MalTay.call(`(push (array (array 4 5 6) (array 7 8 9) ) (array 10 11 12) 1)`);
    expect(resp).toEqual([[4, 5, 6], [7, 8, 9], [10, 11, 12]]);

    resp = await MalTay.call(`(push (array "0x1122" "0x3344" "0x5566") "0x7788")`);
    expect(resp).toEqual(['0x1122', '0x3344', '0x5566', '0x7788']);

    resp = await MalTay.call(`(push (array) "0x7788")`);
    expect(resp).toEqual(['0x7788']);

    resp = await MalTay.call(`(push (array) 20)`);
    expect(resp).toEqual([20]);
});

it('test slice', async function() {
    let resp;

    resp = await MalTay.call(`(slice "0x11223344556677" 3)`);
    expect(resp).toEqual(['0x112233', '0x44556677']);

    resp = await MalTay.call(`(slice "0x1122334455" 5)`);
    expect(resp).toEqual(['0x1122334455', '0x']);

    resp = await MalTay.call(`(slice "0x" 5)`);
    expect(resp).toEqual(['0x', '0x']);
});

it('test length', async function() {
    let resp;

    resp = await MalTay.call(`(length "0x11223344556677")`);
    expect(resp).toBe(7);

    // TODO same function for array length (diff behaviour per type);
});

it('test bytesToArray', async function() {
    let resp;
    let bytesToArray = `(def! bytesToArray (fn* (bval slotLen offset accum) 
        (let* (
                sliced (slice bval (add slotLen offset))
                newaccum (push accum (nth sliced 0))
            )
            (if (lt (length bval) slotLen)
                newaccum
                (bytesToArray (nth sliced 1) slotLen 0 newaccum)
            )
        )
    ))`;
    bytesToArray = `(def! bytesToArray (fn* (bval slotLen offset accum)
        (if (lt (length bval) slotLen)
            accum
            (let* (
                    sliced (slice bval (add slotLen offset))
                    newaccum (push accum (nth sliced 0))
                )
                (bytesToArray (nth sliced 1) slotLen 0 newaccum)
            )
        )
    ))`

    await MalTay.sendAndWait(bytesToArray);

    resp = await MalTay.call(`(bytesToArray "0x1122334455667788" 4 0 (array))`);
    expect(resp).toEqual(['0x11223344', '0x55667788']);

    resp = await MalTay.call(`(bytesToArray "0x1122334455667788" 4 0 (array "0x11223344"))`);
    expect(resp).toEqual(['0x11223344', '0x11223344', '0x55667788']);

    resp = await MalTay.call(`(bytesToArray "0x1122334455667788" 2 0 (array))`);
    expect(resp).toEqual(['0x1122', '0x3344', '0x5566', '0x7788']);
});

it('test join', async function() {
    let resp;
    resp = await MalTay.call(`(join "0x112233" "0x445566"))`);
    expect(resp).toBe('0x112233445566');

    resp = await MalTay.call(`(join "0x112233" 8))`);
    expect(resp).toBe('0x11223300000008');

    resp = await MalTay.call(`(join "hello" "yello"))`);
    expect(resp).toBe('helloyello');

    resp = await MalTay.call(`(join "0x112233" "hello"))`);
    expect(resp).toBe('0x1122330000000000000000000000000000000000000000000000680065006c006c006f');

    resp = await MalTay.call(`(join "0x" "0x445566"))`);
    expect(resp).toBe('0x445566');
});

it('test arrayToBytes', async function() {
    let resp;

    await MalTay.sendAndWait(`(def! arrayToBytes (fn* (somearray)
        (reduce join somearray "0x")
    ))`);
    resp = await MalTay.call(`(arrayToBytes (array "0x112233" "0x445566" "0x778899"))`);
    expect(resp).toBe('0x112233445566778899');
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

        await MalTay.sendAndWait('(defstruct! SomeStruct (list Uint Bool Uint))');
        await MalTay.sendAndWait('(defmap! "structbyaddr" Address SomeStruct)');

        // TODO: (getsig Voter)
        resp = await MalTay.call('(getfrom Map 1)');
        expect(resp.substring(0, 18)).toBe(expr2h('(Address)'));

        await MalTay.send('(mapset! structbyaddr (caller) (struct! SomeStruct (list 3 true 66) ))');

        resp = await MalTay.call(`(list-struct (getfrom SomeStruct 0))`);
        expect(resp).toEqual([3, 1, 66]);

        resp = await MalTay.call(`(list-struct (mapget structbyaddr (caller)))`);
        expect(resp).toEqual([3, 1, 66]);

        resp = await MalTay.call(`(let* ( somvar (list-struct (mapget structbyaddr (caller))) ) somvar)`);
        expect(resp).toEqual([3, 1, 66]);

        resp = await MalTay.call(`(let* ( somvar (list-struct (mapget structbyaddr (caller))) ) (nth somvar 2))`);
        expect(resp).toEqual(66);
    });
});

describe('ballot contract', function() {
    let voter1, voter2, voter3,
        voter1_addr, voter2_addr, voter3_addr;

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
        (struct! Proposal (list "proposal1" 0))
        (struct! Proposal (list "proposal2" 0))
        (struct! Proposal (list "proposal3" 0))
    )`;

    const checkinit = `(list
        (list-struct (getfrom Proposal 0))
        (list-struct (getfrom Proposal 1))
        (list-struct (getfrom Proposal 2))
    )`

    const giveRightToVote = `(def! giveRightToVote! (fn* (voterAddress)
        (if (eq (caller) (sload 0 Address))
            (if (nil? (mapget voters voterAddress))
                (mapset! voters voterAddress (struct! Voter (list 1 false "0x0000000000000000000000000000000000000000" 0)))
                (revert "The voter already voted.")
            )
            (revert "Only chairperson can give right to vote.")
        )
    ))`

    let vote = `(def! vote! (fn* (proposalIndex)
        (let* (
                sender_raw (mapget voters (caller))
                sender (list-struct sender_raw)
                sender_types (defstruct Voter)
                sender_indexes (refs-struct sender_raw)
                proposal_raw (getfrom Proposal proposalIndex)
                proposal (list-struct proposal_raw)
                proposal_types (defstruct Proposal)
                proposal_indexes (refs-struct proposal_raw)
            )
            (if (or 
                    (or (nil? sender) (true? (nth sender 1)))
                    (lt (nth sender 0) 1)
                )
                (revert "Has no right to vote")
                (list
                    ; sender.voted = true
                    (update! (nth sender_types 1) (nth sender_indexes 1) true)
                    ; sender.vote = proposal
                    (update! (nth sender_types 3) (nth sender_indexes 3) proposalIndex)
                    
                    ; proposals[proposal].voteCount += sender.weight
                    (update! (nth proposal_types 1) (nth proposal_indexes 1) (add (nth sender 0) (nth proposal 1)))
                )
            )
        )
    ))`

    let recursiveDelegation = `(def! recDelegation (fn* (to_address)
        (let* (
                delegate_raw (mapget voters to_address)
                delegate (list-struct delegate_raw)
            )
            (if (nil? delegate)
                ; (revert "Delegate cannot vote")
                (revert to_address)
                (let* (delegateOfDelegate (nth delegate 2))
                    (if (or
                            (nil? delegateOfDelegate)
                            (eq delegateOfDelegate "0x0000000000000000000000000000000000000000")
                        )
                        to_address
                        (if (eq delegateOfDelegate (caller))
                            (revert "Found loop in delegation.")
                            (recDelegation delegateOfDelegate)
                        )
                    )
                )
            )
        )
    ))`;

    let delegate = `(def! delegate! (fn* (to_address)
        (let* (
                sender_raw (mapget voters (caller))
                sender (list-struct sender_raw)
                sender_types (defstruct Voter)
                sender_indexes (refs-struct sender_raw)
            )
            (if (true? (nth sender 1))
                (revert "You already voted.")
                (if (eq to_address (caller))
                    (revert "Self-delegation is disallowed.")
                    (let* (
                            delegateAddress (recDelegation to_address)
                            delegate_raw (mapget voters delegateAddress)
                            delegate (list-struct delegate_raw)
                        )
                        (list
                            ; sender.voted = true
                            (update! (nth sender_types 1) (nth sender_indexes 1) true)
                            ; sender.delegate = to
                            (update! (nth sender_types 2) (nth sender_indexes 2) delegateAddress)
                            (if (true? (nth delegate 1))
                                ; proposals[delegate_.vote].voteCount += sender.weight
                                (let* (
                                        proposal_raw (getfrom Proposal (nth delegate 3))
                                        proposal (list-struct proposal_raw)
                                        proposal_types (defstruct Proposal)
                                        proposal_indexes (refs-struct proposal_raw)
                                    )
                                    (update! (nth proposal_types 1) (nth proposal_indexes 1) (add (nth sender 0) (nth proposal 1)))
                                )

                                ; delegate_.weight += sender.weight
                                (let* (
                                        delegate_types (defstruct Voter)
                                        delegate_indexes (refs-struct delegate_raw)
                                    )
                                    (update! (nth delegate_types 0) (nth delegate_indexes 0) (add (nth delegate 0) (nth sender 0)))
                                )
                            )
                        )
                    )
                )
            )
        )
    ))`

    it('prep accounts', async function() {
        voter1 = MalTay.provider.getSigner(3);
        voter2 = MalTay.provider.getSigner(4);
        voter3 = MalTay.provider.getSigner(5);
        voter1_addr = (await voter1.getAddress()).toLowerCase();
        voter2_addr = (await voter2.getAddress()).toLowerCase();
        voter3_addr = (await voter3.getAddress()).toLowerCase();
    }, 20000);

    it('initialize types & save proposals', async function() {
        await MalTay.sendAndWait(init);
        await MalTay.sendAndWait(init2);

        resp = await MalTay.call(checkinit);
        expect(resp[0]).toEqual(['proposal1', 0]);
        expect(resp[1]).toEqual(['proposal2', 0]);
        expect(resp[2]).toEqual(['proposal3', 0]);

        resp = await MalTay.call('(eq (caller) (sload 0 Address))');
        expect(resp).toBe(1);
    }, 20000);

    it('giveRightToVote!', async function() {
        resp = await MalTay.call('(nil? (mapget voters "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51"))');
        expect(resp).toBe(true);

        resp = await MalTay.call('(nil? (list-struct (mapget voters "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51")))');
        expect(resp).toBe(true);

        await MalTay.sendAndWait(giveRightToVote);
        
        await MalTay.send('(giveRightToVote! "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51")');

        resp = await MalTay.call('(nil? (mapget "voters" "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51"))');
        expect(resp).toBe(false);

        resp = await MalTay.call('(nil? (list-struct (mapget voters "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51")))');
        expect(resp).toBe(false);

        resp = await MalTay.call('(list-struct (mapget voters "0xe8B7665DE12D67bC802aEcb8eef4D8bd34741C51"))')
        expect(resp).toEqual([1, 0, '0x0000000000000000000000000000000000000000', 0]);

        await MalTay.send('(giveRightToVote! (caller))');
        resp = await MalTay.call('(list-struct (mapget voters (caller)))')
        expect(resp).toEqual([1, 0, '0x0000000000000000000000000000000000000000', 0]);

        await MalTay.send(`(giveRightToVote! "${voter1_addr}")`);
        resp = await MalTay.call(`(list-struct (mapget voters "${voter1_addr}"))`)
        expect(resp).toEqual([1, 0, '0x0000000000000000000000000000000000000000', 0]);

        await MalTay.send(`(giveRightToVote! "${voter2_addr}")`);
        resp = await MalTay.call(`(list-struct (mapget voters "${voter2_addr}"))`)
        expect(resp).toEqual([1, 0, '0x0000000000000000000000000000000000000000', 0]);

        await MalTay.send(`(giveRightToVote! "${voter3_addr}")`);
        resp = await MalTay.call(`(list-struct (mapget voters "${voter3_addr}"))`)
        expect(resp).toEqual([1, 0, '0x0000000000000000000000000000000000000000', 0]);
    }, 20000);

    it('vote!', async function() {
        await MalTay.sendAndWait(vote);
        await MalTay.send('(vote! 2)');

        resp = await MalTay.call('(list-struct (getfrom Proposal 2))')
        expect(resp).toEqual(['proposal3', 1]);

        resp = await MalTay.call('(list-struct (mapget voters (caller)))')
        expect(resp).toEqual([1, 1, '0x0000000000000000000000000000000000000000', 2]);
    }, 20000);

    it('delegate! & recursiveDelegation store', async function() {
        await MalTay.sendAndWait(recursiveDelegation);
        await MalTay.sendAndWait(delegate);
    }, 20000);

    it('voter2 delegate! -> voter3', async function() {
        await MalTay.send(`(delegate! "${voter3_addr}" )`, {}, voter2);

        resp = await MalTay.call(`(list-struct (mapget voters "${voter2_addr}" ))`)
        expect(resp).toEqual([1, 1, voter3_addr, 0]);

        resp = await MalTay.call(`(list-struct (mapget voters "${voter3_addr}" ))`)
        expect(resp).toEqual([2, 0, '0x0000000000000000000000000000000000000000', 0]);
    }, 20000);

    it('voter1 delegate! -> voter2 -> voter3', async function() {
        resp = await MalTay.call(`(list-struct (mapget voters "${voter1_addr}" ))`)
        expect(resp).toEqual([1, 0, '0x0000000000000000000000000000000000000000', 0]);

        await MalTay.send(`(delegate! "${voter2_addr}" )`, {}, voter1);

        resp = await MalTay.call(`(list-struct (mapget voters "${voter1_addr}" ))`)
        expect(resp).toEqual([1, 1, voter3_addr, 0]);

        // resp = await MalTay.call(`(list-struct (mapget voters "${voter2_addr}" ))`)
        // expect(resp).toEqual([1, 1, voter3_addr, 0]);

        resp = await MalTay.call(`(list-struct (mapget voters "${voter3_addr}" ))`)
        expect(resp).toEqual([3, 0, '0x0000000000000000000000000000000000000000', 0]);
    }, 20000);

    it('delegated voting', async function() {
        await MalTay.send(`(vote! 1)`, {}, voter3);

        resp = await MalTay.call('(list-struct (getfrom Proposal 1))')
        expect(resp).toEqual(['proposal2', 3]);

        resp = await MalTay.call(`(list-struct (mapget voters "${voter3_addr}" ))`)
        expect(resp).toEqual([3, 1, '0x0000000000000000000000000000000000000000', 1]);

        // resp = await MalTay.call(`(list-struct (mapget voters "${voter2_addr}" ))`)
        // expect(resp).toEqual([1, 1, voter3_addr, 0]);
    }, 20000);
}, 30000);

describe.skip('test update!', function() {
    it('update setup struct', async function() {
        await MalTay.send('(defstruct! UpdatableStruct (list Bytes4 Uint) )');
        await MalTay.send('(struct! UpdatableStruct (list "0x11223344" 2))');

        resp = await MalTay.call('(getfrom Bytes4 0)')
        expect(resp).toEqual('0x11223344');

        resp = await MalTay.call('(getfrom Uint 0)')
        expect(resp).toEqual(2);

        resp = await MalTay.call('(refs-struct (getfrom UpdatableStruct 0))')
        expect(resp).toEqual([0, 0]);

        resp = await MalTay.call('(list-struct (getfrom UpdatableStruct 0))')
        expect(resp).toEqual(['0x11223344', 2]);
    });

    it('test static length update', async function() {
        await MalTay.send(`(list
            (update! Bytes4 0 "0x11223355")
            (update! Uint 0 5)
        )`);
        resp = await MalTay.call('(list-struct (getfrom UpdatableStruct 0))')
        expect(resp).toEqual(['0x11223355', 5]);
    });

    it('test struct components update', async function() {
        await MalTay.send(`(let* (
                stypes (defstruct UpdatableStruct)
                indexes (refs-struct (getfrom UpdatableStruct 0))
            )
            (list
                (update! (nth stypes 0) (nth indexes 0) "0x55667788")
                (update! (nth stypes 1) (nth indexes 1) 7)
            )
        )`);
    
        resp = await MalTay.call('(refs-struct (getfrom UpdatableStruct 0))')
        expect(resp).toEqual([0, 0]);

        resp = await MalTay.call('(list-struct (getfrom UpdatableStruct 0))')
        expect(resp).toEqual(['0x55667788', 7]);
    });
});
