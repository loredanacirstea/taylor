const BN = require('bn.js');
require('../src/extensions.js');
const { taylor, signer, provider, getTestCallContract } = require('./setup/fixtures.js');
const tay = require('../src/v3/tay.js');
const tests = require('./json_tests/index.js');

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
        await instance.send('(setalias "mulmul" (setfn (fn* (a b) (mul_ a b))) )');

        resp = await instance.call('(apply (getfn "0x3400100000000000") 4 2)');
        expect(resp).toEqual(8);

        resp = await instance.call('(apply (getfn (getalias "mulmul")) 4 2)');
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
});
