const BN = require('bn.js');
require('../src/extensions.js');
const { taylor, signer, provider } = require('./setup/fixtures.js');
// const tayf = require('../src/native.js');
const tay = require('../src/v2/tay.js');

const bootstrap = {
    'alias!': `(def! alias! (fn* (name value)
(store! (keccak256 10 name) value)
))`,

    'alias': `(def! alias (fn* (name)
(sload (keccak256 10 name))
))`,

    dtype: `(def! dtype (fn* (signature)
(sload (keccak256 11 signature))
))`,

    getTypeIndex: `(def! getTypeIndex (fn* (signature)
(let* (
        currentIndex (sload (keccak256 12 signature))
    )
    (add 1 (if (nil? currentIndex) 0 currentIndex))
)
))`,

    buildSig: `(def! buildSig (fn* (super kidIndex inputs)
(if (nil? super)
    (list 0 0)
    (let* (
            super_type (dtype super)
            super_type_sigf (nth super_type 5)
            id (buildSig (nth super_type 0) (nth super_type 1) (nth super_type 4))
            sig (add
                (nth id 0)
                (shl (nth super_type 3) kidIndex)
            )
        )
        (list
            (if (nil? super_type_sigf)
                sig
                (apply super_type_sigf sig inputs)
            )
            (add (nth id 1) (nth super_type 2) )
        )
    )
)
))`,

    formatSig: `(def! formatSig (fn* (value)
(let* (
        bvalue (join "0x" value)
        bvalue_len (length bvalue)
    )
    (join bvalue (contig (sub 8 bvalue_len) "0x00") )
)
))`,

    padleft: `(def! padleft (fn* (value size padding)
(let* (
        bvalue (join "0x" value)
    )
    (join (contig (sub size (length bvalue)) padding) bvalue )
)
))`,

    'dtype!': `(def! dtype! (fn* (super name idbits idshifts inputs scriptSig scriptExecute)
(let* (
        salt 11
        ; index (getTypeIndex super)
        id_data (buildSig super (getTypeIndex super) inputs)
        signature (formatSig (nth id_data 0))
    )
    (list
        (alias! name signature)
        (store! (keccak256 salt signature) (list super (getTypeIndex super) idbits idshifts inputs scriptSig scriptExecute))
        (store!
            (keccak256 12 super) 
            (getTypeIndex super)
        )
        ; (log salt signature name)
    )
)
))`,
}

let Tay, TayJs;

beforeAll(() => {
  return taylor.deployRebuild().then(t => {
    console.log('****Tay', t.address);
    Tay = tay.getTay(t.provider, t.signer)(t.address);
  })
    .then(() => tay.js.getBackend(Tay.address, Tay.provider, Tay.signer))
}, 50000);

// afterAll(() => {
//     if (Tay) Tay.unwatch();
//     return;
// });

const types = {
    root: `(def-untyped! root nil 4 28 (list root) nil nil)`
}

const tth = {
    root: '0000000000000000',
    nil: '0000000000000000',
    'store!': '0000000000000001',
    sload: '0000000000000002',
    def_unt_bang: '0000000000000003',  // def-untyped!
    def_unt: '0000000000000004',
    uint: (size, val) => (new taylor.BN('1a380000', 16)).add(new BN(size)).toString(16) + taylor.u2h(val).padStart(size * 2, '0'),
    string: len => '48000000' + taylor.u2h(len).padStart(8, '0'),
    list: arity => (new taylor.BN('28800000', 16)).add(new BN(arity)).toString(16),
}

describe('taylor bootstrap', function () {
    let resp, expr;

    test.only('native functions', async function () {
        resp = await Tay.call('(add 5 15)')
        console.log('resp', resp);
        expect(resp).toBe(20);
    });

    test.only('native functions', async function () {
        resp = await Tay.call('(add (sub 25 15) 3)')
        console.log('resp', resp);
        expect(resp).toBe(13);
    });

    test.only('native functions', async function () {
        resp = await Tay.call('(add (iszero 0) (iszero 4))')
        console.log('resp', resp);
        expect(resp).toBe(1);
    });

    test('def-untyped! root', async function () {
        // (def-untyped! )
        let name = "root".hexEncode();
        console.log('name', name);
        expr = '0x' + tth.def_unt_bang
           //  + tth.string(name.length) + name
           + taylor.u2h(name.length / 2).padStart(8, '0') + name
        
        let tobesaved = tth.list(5)
            + tth.nil // super
            + tth.uint(4, 4)
            + tth.uint(4, 28)
            + tth.nil + tth.nil;
        expr += taylor.u2h(tobesaved.length / 2).padStart(8, '0') + tobesaved;

        console.log('expr', expr);
        resp = await TaylorC.send_raw(expr);
        // resp = await TaylorC.call_raw(expr);
        // expect(resp).toBe('0x44556677');

        expr = '0x' + tth.def_unt
            + tth.root;
        resp = await TaylorC.call_raw(expr);
        console.log('resp', resp);
        // expect(resp).toBe('0x44556677');
    });

    test('def-untyped! number', async function () {
        // (def-untyped! )
        let name = "number".hexEncode();
        console.log('name', name);
        expr = '0x' + tth.def_unt_bang
           //  + tth.string(name.length) + name
           + taylor.u2h(name.length / 2).padStart(8, '0') + name
        
        let tobesaved = tth.list(5)
            + tth.root // super
            + tth.uint(4, 4)
            + tth.uint(4, 28)
            + tth.nil + tth.nil;
        expr += taylor.u2h(tobesaved.length / 2).padStart(8, '0') + tobesaved;

        console.log('expr', expr);
        // resp = await TaylorC.send_raw(expr);
        resp = await TaylorC.call_raw(expr);
        expect(resp).toBe('0x44522222222256677');

        expr = '0x' + tth.def_unt
            + tth.root;
        resp = await TaylorC.call_raw(expr);
        console.log('resp', resp);
        // expect(resp).toBe('0x44556677');
    });
});

describe.skip('dtype_2', function () {
    let resp;

    test('alias', async function () {
        resp = await TaylorC.sendAndWait('(alias! "name1" "0x44556677" )');
        resp = await TaylorC.call('(alias "name1")');
        expect(resp).toBe('0x44556677');
    });

    test('buildSig super nil', async function () {
        resp = await TaylorC.call('(buildSig nil 1 nil)');
        expect(resp).toEqual([0, 0]);
    });

    test('formatSig 0', async function () {
        resp = await TaylorC.call('(formatSig 0)');
        expect(resp).toEqual('0x0000000000000000');
    });

    test.skip('insert type: any', async function () {
        // 0000000000000000000000000000000000000000000000000000000000000000 - id
        // 1110000000000000000000000000000000000000000000000000000000000000 - kids mask
        // 0xe000000000000000 - mask
        resp = await TaylorC.call(`(dtype! nil "any" 3 61 (list "any")
            (fn* (id inputs)
                id
            )
            (fn* (value) 
                (join "0x0000000000000000" value)
            )
        )`);
        expect(resp).toBe(4)
    });

    test('insert type: any', async function () {
        // 0000000000000000000000000000000000000000000000000000000000000000 - id
        // 1110000000000000000000000000000000000000000000000000000000000000 - kids mask
        // 0xe000000000000000 - mask
        resp = await TaylorC.sendAndWait(`(dtype! nil "any" 3 61 (list "any")
            (fn* (id inputs)
                id
            )
            (fn* (value) 
                (join "0x0000000000000000" value)
            )
        )`);
    });

    test('alias any', async function () {
        resp = await TaylorC.call('(alias "any")');
        expect(resp).toBe('0x0000000000000000');
    });

    test('dtype any', async function () {
        // idshifts
        resp = await TaylorC.call('(nth (dtype (alias "any")) 3)');
        expect(resp).toBe(61);

        resp = await TaylorC.call('(getTypeIndex nil)');
        expect(resp).toBe(2);

        resp = await TaylorC.call('(getTypeIndex (alias "any") )');
        expect(resp).toBe(1);

        // index
        resp = await TaylorC.call('(nth (dtype (alias "any")) 1)');
        expect(resp).toBe(1);
    });

    test('buildSig super any', async function () {
        resp = await TaylorC.call('(buildSig (alias "any") 1 nil)');
        expect(resp).toEqual(['2000000000000000', 3]);
    });

    test('insert type: number', async function () {
        // 0010000000000000000000000000000000000000000000000000000000000000 - id
        // 0001100000000000000000000000000000000000000000000000000000000000 - kids mask
        // 0xe000000000000000 - mask
        resp = await TaylorC.sendAndWait(`(dtype! (alias "any") "number" 2 59 (list "number")
            (fn* (id inputs)
                id
            )
            (fn* (value) 
                (join "0x" value)
            )
        )`);
        resp = await TaylorC.call('(alias "number")');
        expect(resp).toBe('0x2000000000000000');
    });

    test('insert type: real', async function () {
        resp = await TaylorC.sendAndWait(`(dtype! (alias "number") "real" 3 56 (list "real")
            (fn* (id inputs)
                id
            )
            (fn* (value) 
                (join "0x" value)
            )
        )`);
        resp = await TaylorC.call('(alias "real")');
        expect(resp).toBe('0x2800000000000000');
    }, 20000);

    // test('insert type: uint', async function () {
    //     resp = await TaylorC.sendAndWait(`(dtype! (alias "real") "uint" 0 0 (list "uint")
    //         (fn* (id inputs)
    //             id
    //         )
    //         (fn* (value) 
    //             (join "0x" value)
    //         )
    //     )`);
    //     resp = await TaylorC.call('(alias "uint")');
    //     expect(resp).toBe('0x2900000000000000');
    // }, 20000);

    test('insert type: uint', async function () {
        resp = await TaylorC.sendAndWait(`(dtype! (alias "real") "uint" 0 0 (list "uint")
            (fn* (id size)
                (add id size)
            )
            (fn* (size value)
                (join-untyped 
                    (formatSig (nth (buildSig (alias "uint") 0 size) 0) )
                    (padleft value size "0x00")
                )
            )
        )`);
        resp = await TaylorC.call('(alias "uint")');
        expect(resp).toBe('0x2900000000000000');
    }, 20000);

    test('execute type: uint', async function () {
        resp = await TaylorC.call_no_decode('(apply (nth (dtype (alias "uint")) 6) 10 14)');
        // resp = await TaylorC.call_raw(expr2h('(apply (nth (dtype (alias "uint")) 6) 10 14)'));
        expect(resp).toBe('0x290000000000000a0000000000000000000e');
    });

    test('insert type: function', async function () {
        resp = await TaylorC.sendAndWait(`(dtype! (alias "any") "function" 1 60 nil
            (fn* (id inputs)
                id
                (let* (
                    arity (length inputs)
                    ;mutable <from name>
                )
                    (add (add (exp 2 31) (shl 27 arity)) (shl 1 id) )
                    ; (add (add (add (exp 2 31) (shl 27 arity)) (shl 1 id) ) mutable)
                )
            )
            (fn* (value) 
                (join "0x" value)
            )
        )`);
        resp = await TaylorC.call('(alias "function")');
        expect(resp).toBe('0x4000000000000000');
    });

    test('insert type: functionT', async function () {
        resp = await TaylorC.sendAndWait(`(dtype! (alias "function") "functionT" 1 60 nil
            nil
            (fn* (value) nil)
        )`);
        resp = await TaylorC.call('(alias "functionT")');
        expect(resp).toBe('0x5000000000000000');
    }, 20000);

    test('insert type: afunc', async function () {
        resp = await TaylorC.sendAndWait(`(dtype! (alias "functionT") "afunc" 0 0 (list "0x2900000000000006" "0x2900000000000006")
            nil
            (fn* (a b) (add a b))
        )`);
        resp = await TaylorC.call('(alias "afunc")');
        expect(resp).toBe('0x6000000000000000');
    }, 20000);

    test('execute afunc', async function () {
        resp = await TaylorC.call_no_decode('(apply (nth (dtype (alias "afunc")) 6) 10 14)');
        // resp = await TaylorC.call_raw(expr2h('(apply (nth (dtype (alias "uint")) 6) 10 14)'));
        // expect(resp).toBe('0x290000000000000600000000000000000018');
        expect(resp).toBe('0x0a91000400000018');
    });
});
