const assert = require('assert');
const { provider, signer, getTaylor } = require('./setup/fixtures.js');
const { defs_new } = require('./setup/dtypes.js');

let Taylor;

beforeAll(() => {
  return getTaylor().then(t => {
    Taylor = t;
  });
});

it('store uint', async function () {
  await Taylor.send(defs_new.uint);
});

it('get uint', async function () {
  const uint8 = await Taylor.call('0xfffffffd11000000');
  expect(uint8).toBe('0x000000000000000dee0000010000000522000001110000001d3333333800000000333333350000000200023333333000000003010003');
});
