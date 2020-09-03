const BN = require('bn.js');
require('../src/extensions.js');
const { taylor, signer, provider, getTestCallContract } = require('./setup/fixtures.js');
const tay = require('../src/v3/tay.js');
const tests = require('./json_tests/index.js');

describe.each([
    ['chain'],
    // ['js'],
])(' (%s)', (backendname) => {
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
        await instance.send('(setalias "mulmul" (setfn (fn* (a b) (mul_ a b))) )');

        resp = await instance.call('(apply (getfn "0x3400100000000000") 4 2)');
        expect(resp).toEqual(8);

        resp = await instance.call('(apply (getfn (getalias "mulmul")) 4 2)');
        expect(resp).toEqual(8);
    });

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
});
