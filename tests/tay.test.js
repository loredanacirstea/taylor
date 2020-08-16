const BN = require('bn.js');
require('../src/extensions.js');
const { taylor, signer, provider, getTestCallContract } = require('./setup/fixtures.js');
const tay = require('../src/v2/tay.js');
const tests = require('./json_tests/index.js');

describe.each([
    ['chain'],
    ['js'],
])(' (%s)', (backendname) => {
    let instance;
    if (backendname === 'chain') {
        beforeAll(() => {
            return taylor.deployRebuild().then(t => {
              console.log('****Tay', t.address);
              instance = tay.getTay(t.provider, t.signer)(t.address);
            })
              .then(() => tay.js.getBackend(instance.address, instance.provider, instance.signer))
        }, 50000);
    } else {
        beforeAll(() => {
            return tay.js.getBackend(null, provider, signer)
                .then(inst => instance = inst);
        });
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

    if (backendname !== 'chain') return;
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
        console.log('--expr', expr);
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
        console.log('--expr', expr);
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
