const BN = require('bn.js');
require('../src/extensions.js');
const { taylor, signer, provider, getTestCallContract } = require('./setup/fixtures.js');
const tay = require('../src/v3/tay.js');
const tests = require('./json_tests/index.js');
const { SimpleYul, SimpleSol, SimpleStorage, Ballot } = require('./setup/test_bytecodes');
const { x0, strip0x } = require('../src/utils.js');

describe.each([
    ['chain'],
    // ['js'],
])('Test EVM (%s)', (backendname) => {
    let instance;
    if (backendname === 'chain') {
        beforeAll(() => {
            return taylor.deployRebuild(3).then(t => {
              console.log('****Tay', t.address);
              instance = tay.getTay(t.provider, t.signer)(t.address);
            })
            //   .then(() => tay.js.getBackend(instance.address, instance.provider, instance.signer))
        }, 50000);
    } else {
        // beforeAll(() => {
        //     return tay.js.getBackend(null, provider, signer)
        //         .then(inst => instance = inst);
        // });
    }

    let resp;
    for (name of Object.keys(tests.evm.tests)) {
        const tts = tests.evm.tests[name]
        tts.map((tt, i) => {
            let testapi = test;
            if (tt.skip) testapi = test.skip;
            if (tt.only) testapi = test.only;

            testapi(name + '_' + i, async function () {
                resp = await instance.call(tt.test, tt.txObj || {}, tt.decode);
                if (tt.process) resp = tt.process(resp, instance);
                expect(resp).toEqual(tt.result);
            }, tt.wait || 10000);
        });
    }

    for (name of Object.keys(tests.core.tests)) {
        const tts = tests.core.tests[name]
        tts.map((tt, i) => {
            let testapi = test;
            if (tt.skip) testapi = test.skip;
            if (tt.only) testapi = test.only;

            testapi(name + '_' + i, async function () {
                resp = await instance.call(tt.test, tt.txObj || {}, tt.decode);
                if (tt.process) resp = tt.process(resp, instance);
                expect(resp).toEqual(tt.result);
            }, tt.wait || 10000);
        });
    }

});

describe.each([
    ['chain'],
    // ['js'],
])('Test core (%s)', (backendname) => {
    let instance;
    if (backendname === 'chain') {
        beforeAll(() => {
            return taylor.deployRebuild(3).then(t => {
              console.log('****Tay', t.address);
              instance = tay.getTay(t.provider, t.signer)(t.address);
            })
            //   .then(() => tay.js.getBackend(instance.address, instance.provider, instance.signer))
        }, 50000);
    } else {
        // beforeAll(() => {
        //     return tay.js.getBackend(null, provider, signer)
        //         .then(inst => instance = inst);
        // });
    }

    it('add', async function () {
        const resp = await instance.call('(add_ 4 5)');
        expect(resp).toEqual(9);
    });

    it('lambda', async function () {
        const resp = await instance.call('((fn* (a b) (mul_ a b)) 4 2)');
        expect(resp).toEqual(8);
    });

    it('stored', async function () {
        let resp;
        await instance.send('(setalias! (keccak256_ "mulmul_") (setfn! (fn* (a b) (mul_ a b))) )');

        resp = await instance.call('(apply_ (getfn 0x3100004200000000000000000000000000000000000000000000000000000000) 4 2)');
        expect(resp).toEqual(8);

        resp = await instance.call('(apply_ (getfn (getalias (keccak256_ "mulmul_") )) 4 2)');
        expect(resp).toEqual(8);
    });

    it('def!', async function () {
        let resp;
        await instance.send('(def! fnmul_ (fn* (a b) (mul_ a b)) )');

        resp = await instance.call('(fnmul_ 4 2)');
        expect(resp).toEqual(8);
    });

    it('if', async function () {
        let resp;
        resp = await instance.call('(if (gt_ 4 3) (add_ 4 5) (mul_ 4 5) )');
        expect(resp).toEqual(9);

        resp = await instance.call('(if (lt_ 4 3) (add_ 4 5) (mul_ 4 5) )');
        expect(resp).toEqual(20);
    });

    it('memory-stack', async function () {
        let resp;

        resp = await instance.call('(add_ (sub_ 9 (mul_ 1 3)) 5)');
        expect(resp).toEqual(11);

        resp = await instance.call('(memory (add_ (sub_ 9 (mul_ 1 3)) 5) )');
        expect(resp).toEqual(11);

        resp = await instance.call('(stack (add_ (sub_ 9 (mul_ 1 3)) 5) )');
        expect(resp).toEqual(11);

        // TODO: mix stack & memory - needs adapter function
        // resp = await instance.call('(memory (add_ (stack (sub_ 9 (mul_ 1 3)) ) 5) )');
        // expect(resp).toEqual(11);
    });

    it('recursive lambda', async function () {
        let resp;
        resp = await instance.call(`((fn* (n max) (if (gt_ n max)
                n
                (self (add_ n 1) max)
            )
        ) 0 2)`);  // 200
        expect(resp).toEqual(3);
    }, 300000);


    it('recursive lambda memory', async function () {
        let resp;
        resp = await instance.call(`(memory
            ((fn* (n max) (if (gt_ n max)
                n
                (self (add_ n 1) max)
            )
        ) 0 2) )`);
        expect(resp).toEqual(3);
    }, 300000);

    it('recursive lambda memory', async function () {
        let resp;
        resp = await instance.call(`(memory
            ((fn* (n max) (if (gt_ n max)
                n
                (add_ (self (add_ n 1) max) 5)
            )
        ) 0 2) )`); // 100
        expect(resp).toEqual(18);
    }, 300000);

    it('fibonacci lambda', async function () {
        let resp;
        resp = await instance.call(`((fn* (n)
            (if (or_ (eq_ n 1) (eq_ n 2))
                1
                (add_ (self (sub_ n 1)) (self (sub_ n 2)) )
            )
        ) 8)`);  // 10
        expect(resp).toEqual(21);
    }, 30000);

    it('fibonacci lambda memory', async function () {
        let resp;
        resp = await instance.call(`(memory ((fn* (n)
            (if (or_ (eq_ n 1) (eq_ n 2))
                1
                (add_ (self (sub_ n 1)) (self (sub_ n 2)) )
            )
        ) 8) )`);  // 10
        expect(resp).toEqual(21);
    }, 1000000);

    it('test fn in fn', async function () {
        let resp;
        resp = await instance.call(`((fn* (a)
            (if (eq_ 0 (mod_ a 2))
                ((fn* (b) (div_ b 2) ) a)
                a
            )
        ) 6)`);
        expect(resp).toEqual(3);
    });

    it('test super', async function () {
        let resp;
        resp = await instance.call(`((fn* (a)
            (if (eq_ 0 (mod_ a 2))
                ((fn* (b) (super 1 (div_ b 2) ) ) a)
                a
            )
        ) 6)`);
        expect(resp).toEqual(3);
    }, 10000);

    it('test registration', async function () {
        let resp;
        const tay2_ = await taylor.deployRebuild(3);
        const tay2 = tay.getTay(tay2_.provider, tay2_.signer)(tay2_.address);

        await tay2.send('(def! mulmul_ (fn* (a b) (mul_ a b)) )');

        await instance.send(`(setleaf! ${tay2.address} )`);

        resp = await instance.call('(mulmul_ 4 2)');
        expect(resp).toEqual(8);
    });

    it.skip('test registration2', async function () {
        let resp;
        // await instance.call('(return# )')
        const tay2_ = await taylor.deployRebuild(3);
        const tay2 = tay.getTay(tay2_.provider, tay2_.signer)(tay2_.address);

        await tay2.send('(def! fntest__ (fn* () "0x112233445566") )');

        await instance.send(`(setleaf! ${tay2.address} )`);

        resp = await instance.call('(return# (fntest__ ))');
        expect(resp).toEqual('0x112233445566');
    });

    it('test interpret', async function () {
        resp = await instance.call('(interpret "0x600960050160005260206000f3" "0x")');
        expect(resp).toEqual(14);
    });

    it('test interpret constructor1 - SimpleYul', async function () {
        resp = await instance.call(`(interpret "${SimpleYul.constructor_bytecode}" "0x")`, {}, null);
        expect(resp).toEqual(SimpleYul.runtime_bytecode);

        resp = await instance.call(`(interpret "${SimpleYul.runtime_bytecode}" "0x70a08231")`, {}, null);
        expect(resp).toEqual('0x0000000000000000000000000000000000000000000000000000000000000666');

        resp = await instance.call(`(interpret "${SimpleYul.runtime_bytecode}" "0x18160ddd")`, {}, null);
        expect(resp).toEqual('0x0000000000000000000000000000000000000000000000000000000000000777');
    });

    it('test interpret constructor2 - SimpleSol', async function () {
        resp = await instance.call(`(interpret "${SimpleSol.constructor_bytecode}" "0x")`, {}, null);
        expect(resp).toEqual(SimpleSol.runtime_bytecode);

        resp = await instance.call(`(interpret "${SimpleSol.runtime_bytecode}" "0xeb8ac92100000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000009")`, {}, null);
        expect(resp).toEqual('0x0000000000000000000000000000000000000000000000000000000000000011');
    });

    it('test interpret constructor3 - SimpleStorage', async function () {
        resp = await instance.call(`(interpret "${SimpleStorage.constructor_bytecode}" "0x")`, {}, null);
        expect(resp).toEqual(SimpleStorage.runtime_bytecode);

        await instance.send(`(interpret "${SimpleStorage.runtime_bytecode}" "0x6057361d0000000000000000000000000000000000000000000000000000000000000006")`, {}, null);

        resp = await instance.call(`(interpret "${SimpleStorage.runtime_bytecode}" "0xb05784b8")`, {}, null);
        expect(resp).toEqual('0x0000000000000000000000000000000000000000000000000000000000000006');
    });

    it('test interpret constructor4 - Ballot', async function () {
        let resp;
        const account = (await instance.signer.getAddress()).toLowerCase();

        resp = await instance.call(`(interpret "${Ballot.constructor_bytecode}" "0x")`, {}, null);
        expect(resp).toEqual(Ballot.runtime_bytecode);
        await instance.send(`(interpret "${Ballot.constructor_bytecode}" "0x")`, {}, null);

        // get chairperson
        resp = await instance.call(`(interpret "${Ballot.runtime_bytecode}" "0x2e4176cf")`, {}, null);
        expect(resp).toEqual(x0(strip0x(account).padStart(64, '0')));

        // winnerName
        resp = await instance.call(`(interpret "${Ballot.runtime_bytecode}" "0xe2ba53f0")`, {}, null);
        expect(resp).toEqual('0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000970726f706f73616c310000000000000000000000000000000000000000000000');

        // winningProposal
        resp = await instance.call(`(interpret "${Ballot.runtime_bytecode}" "0x609ff1bd")`, {}, null);
        expect(resp).toEqual('0x0000000000000000000000000000000000000000000000000000000000000000');

        // vote proposal 1
        await instance.send(`(interpret "${Ballot.runtime_bytecode}" "0x0121b93f0000000000000000000000000000000000000000000000000000000000000001")`, {}, null);

        // get proposal 1
        resp = await instance.call(`(interpret "${Ballot.runtime_bytecode}" "0x013cf08b0000000000000000000000000000000000000000000000000000000000000001")`, {}, null);
        expect(resp).toEqual('0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000970726f706f73616c320000000000000000000000000000000000000000000000');

        // winnerName
        resp = await instance.call(`(interpret "${Ballot.runtime_bytecode}" "0xe2ba53f0")`, {}, null);
        expect(resp).toEqual('0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000970726f706f73616c320000000000000000000000000000000000000000000000');

        // winningProposal
        resp = await instance.call(`(interpret "${Ballot.runtime_bytecode}" "0x609ff1bd")`, {}, null);
        expect(resp).toEqual('0x0000000000000000000000000000000000000000000000000000000000000001');
    });

    const byte_ = `(fn* (str pos)
        (byte_ pos (mload_ (t2_ptr_ str)))
    )`;

    const slice___ = `(fn* (str pos)
        (tuple___
            (clone__ (t2_ptr_ str) pos)
            (clone__ (add_ (t2_ptr_ str) pos) (sub_ (t2_len_ str) pos))
        )
    )`;

    it('byte', async function () {
        let resp;

        // t2.byte
        resp = await instance.call(`( ${byte_} "abc" 0)`);
        expect(resp).toEqual(parseInt("a".hexEncode(), 16));

        resp = await instance.call(`( ${byte_} "abc" 2)`);
        expect(resp).toEqual(parseInt("c".hexEncode(), 16));
    });

    it('slice___', async function () {
        let resp;

        resp = await instance.call(`(return# (nth_ (${slice___} "0x112233445566778899" 2) 0))`, {}, null);
        expect(resp).toEqual('0x1122');

        resp = await instance.call(`(return# (nth_ (${slice___} "0x112233445566778899" 2) 1))`, {}, null);
        expect(resp).toEqual('0x33445566778899');

    });

    // deallocation should not happen is the result of the applied function
    // is a pointer calculated in one of the list arguments (function arg)
    it('deallocation bug', async function () {
        let resp;

        resp = await instance.call(`((fn* (str pos)
            (if (gt_ (t2_len_ str) 0)
                (self
                    (nth_ (${slice___} str 1) 1)
                    (add_ pos 1)
                )
                pos
            )
        ) "abc" 0)`);
        expect(resp).toEqual(3);
    });

    it('regex - /<char>*/', async function () {
        let resp;

        const regex_a_any = `(fn* (str char)
            (if (gt_ (t2_len_ str) 0)
                (if (eq_ (${byte_} str 0) char)
                    (self
                        (nth_ (${slice___} str 1) 1)
                        char
                    )
                    0
                )
                1
            )
        )`

        resp = await instance.call(`(${regex_a_any} "" 97)`);
        expect(resp).toEqual(1);

        resp = await instance.call(`(${regex_a_any} "a" 97)`);
        expect(resp).toEqual(1);

        resp = await instance.call(`(${regex_a_any} "b" 97)`);
        expect(resp).toEqual(0);

        resp = await instance.call(`(${regex_a_any} "aa" 97)`);
        expect(resp).toEqual(1);

        resp = await instance.call(`(${regex_a_any} "ab" 97)`);
        expect(resp).toEqual(0);
    }, 60000);

    it('regex - /<char_range>*/', async function () {
        let resp;

        const regex_char_range = `(fn* (str minChar maxChar)
            (if (gt_ (t2_len_ str) 0)
                (if (and_
                        (gt_ (${byte_} str 0) (sub_ minChar 1))
                        (lt_ (${byte_} str 0) (add_ maxChar 1))
                    )
                    (self
                        (nth_ (${slice___} str 1) 1)
                        minChar maxChar
                    )
                    0
                )
                1
            )
        )`

        resp = await instance.call(`(${regex_char_range} "" 97 122)`);
        expect(resp).toEqual(1);

        resp = await instance.call(`(${regex_char_range} "a" 97 122)`);
        expect(resp).toEqual(1);

        resp = await instance.call(`(${regex_char_range} "z" 97 122)`);
        expect(resp).toEqual(1);

        resp = await instance.call(`(${regex_char_range} "[" 97 122)`);
        expect(resp).toEqual(0);

        resp = await instance.call(`(${regex_char_range} "lorez." 97 122)`);
        expect(resp).toEqual(0);

        resp = await instance.call(`(${regex_char_range} "lorez" 97 122)`);
        expect(resp).toEqual(1);

    }, 100000);

});

describe('Test calls', () => {
    let instance;
    beforeAll(() => {
        return taylor.deployRebuild(3).then(t => {
            console.log('****Tay', t.address);
            instance = tay.getTay(t.provider, t.signer)(t.address);
        })
        //   .then(() => tay.js.getBackend(instance.address, instance.provider, instance.signer))
    }, 50000);

    let addr, call_send_contract, sigs, expr, args;

    it('call__ & call!__ - prereq', async function () {
        call_send_contract = await getTestCallContract();
        addr = call_send_contract.address;
        sigs = {
            add: call_send_contract.interface.getSighash('add'),
            somevar: call_send_contract.interface.getSighash('somevar'),
            increase: call_send_contract.interface.getSighash('increase'),
            setname: call_send_contract.interface.getSighash('setname'),
            name: call_send_contract.interface.getSighash('name'),
            pay: call_send_contract.interface.getSighash('pay'),
            getaTuple: call_send_contract.interface.getSighash('getaTuple'),
            testTuple: call_send_contract.interface.getSighash('testTuple'),
        }
        console.log('sigs', sigs);
    }, 10000);

    it('call__ add', async function () {
        args = sigs.add + taylor.u2h(3).padStart(64, '0') + taylor.u2h(9).padStart(64, '0');
        expr = `(return# (call__ ${addr} "${args}" ))`;
        resp = await instance.call(expr);
        expect(resp).toEqual('0x' + taylor.u2h(12).padStart(64, '0'));
    });

    it('call__ somevar', async function () {
        expr = `(return# (call__ ${addr} "${sigs.somevar}" ))`;
        resp = await instance.call(expr);
        expect(resp).toEqual('0x' + taylor.u2h(5).padStart(64, '0'));
    });

    it('call!__ increase (state change)', async function () {
        args = sigs.increase + taylor.u2h(9).padStart(64, '0');
        expr = `(call!__ ${addr} 0 "${args}" )`;
        resp = await instance.send(expr);

        expr = `(return# (call__ ${addr} "${sigs.somevar}" ))`;
        resp = await instance.call(expr);
        expect(resp).toEqual('0x' + taylor.u2h(14).padStart(64, '0'));
    });

    it('call!__ payable', async function () {
        args = sigs.pay + taylor.u2h(9).padStart(64, '0');
        const value = 10;
        expr = `(call!__ ${addr} ${value} "${args}" )`;
        resp = await instance.send(expr, { value });
        expect((await instance.provider.getBalance(addr)).toNumber()).toBe(value);
    });

    it('log_', async function () {
        await instance.send(`(log_ "0x3400180300000032000000000000000000000000cd0139bBE12581e7c4E30A3F91158de6544B64bA")`);
        await instance.send(`(log_ "0x112233445566778899" 10)`);
        await instance.send(`(log_ "0x112233445566778899" 10 88)`);
        await instance.send(`(log_ "0x112233445566778899" 10 88 99)`);
        await instance.send(`(log_ "0x112233445566778899" 10 88 99 1500)`);

        let logs;
        logs = await instance.getLogs();
        expect(logs.length).toBe(5);
        logs.forEach((log, i) => {
            expect(log.topics.length).toBe(i);
        });
    });

    it('tuple___ simple', async function () {
        resp = await instance.call('(return# (tuple_sol__ (tuple___ 100 4) ))');
        expect(resp).toBe('0x00000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000004');
    });

    it('tuple___ with bytes', async function () {
        resp = await instance.call('(return# (tuple_sol__ (tuple___ 100 4 "0x112233445566" "hello" 5) ))');
        expect(resp).toBe('0x0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000061122334455660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000');
    });

    it('tuple___ with tuple', async function () {
        resp = await instance.call('(return# (tuple_sol__ (tuple___ 100 4 (tuple___ "0x112233445566" "hello" 5) 16) ))');
        expect(resp).toBe('0x0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000061122334455660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000');
    });

    it('nth__', async function () {
        resp = await instance.call(`(return# (nth__
            (tuple___ 100 4 (tuple___ "0x112233445566" "hello" 5) 16)
            1
        ))`, {}, ['uint']);
        expect(resp).toBe(4);

        resp = await instance.call(`(return# (nth__
            (nth__
                (tuple___ 100 4 (tuple___ "0x112233445566" "hello" 5) 16)
                2
            ) 1
        ))`, {}, ['string']);
        expect(resp).toBe('hello');
    });

    it('sol_tuple___', async function () {
        resp = await instance.call(`(return# (tuple_sol__ (sol_tuple___
            (tuple_sol__ (tuple___ 100 4))
            (tuple___ 1 1)
        )))`);
        expect(resp).toBe('0x00000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000004');
    });

    it('sol_tuple___', async function () {
        resp = await instance.call(`(return# (tuple_sol__ (sol_tuple___
            (tuple_sol__ (tuple___ "0x112233445566" "hello" 5) )
            (tuple___ 2 2 1)
        )))`);
        expect(resp).toBe('0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000061122334455660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000');
    });

    it('sol_tuple___', async function () {
        resp = await instance.call(`(return# (tuple_sol__ (sol_tuple___
            (tuple_sol__ (tuple___ 100 4 (tuple___ "0x112233445566" "hello" 5) 16))
            (tuple___ 1 1 (tuple___ 2 2 1) 1)
        )))`);
        expect(resp).toBe('0x0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000061122334455660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000');
    });

    it('tuple solidity calls', async function () {
        // resp = await instance.call(`(return# (call__ ${addr}
        //     (join__
        //         "${sigs.testTuple}"
        //         (tuple_sol__ (tuple___ 100 4 (tuple___ "0x112233445566" "hello" 5) 16))
        //     )
        // ))`, {}, ['uint']);
        // expect(resp).toBe(125);

        // resp = await instance.call(`(return# (tuple_sol__ (tuple___ 100 4 (tuple___ "0x112233445566" "hello" 5) 16))
        // )`, {}, ['uint']);
        // expect(resp).toBe(125);

        resp = await instance.call(`(return# (call__ ${addr}
            (join__
                "${sigs.getaTuple}"
                (tuple_sol__ (tuple___ "0x112233445566" "hello" 5))
            )
        ))`);

        expect(resp).toBe('0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000061122334455660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000');
    });

});
