const { provider, signer, getMalTay } = require('./setup/fixtures.js');

let MalTay;

beforeAll(() => {
  return getMalTay().then(t => {
    MalTay = t;
  });
});

// (add 4 3)
it('test sum', async function () {
  const resp = await MalTay.call('0xa00000040000000300000005');
  expect(resp).toBe('0x00000008');
});

// (add (add (sub 7 1) 1) 0x29)
it('test sum', async function () {
    const resp = await MalTay.call('0xa0000004a0000004a000000800000007000000010000000100000029');
    expect(resp).toBe('0x00000030');
});
