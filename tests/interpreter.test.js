const assert = require('assert');
const { provider, signer, getTaylor } = require('./setup/fixtures.js');
const { defs_new, defs_funcs } = require('./setup/dtypes.js');

let Taylor;

beforeAll(() => {
  return getTaylor().then(t => {
    Taylor = t;
  });
});

it('store uint', async function () {
  await Taylor.storeType(defs_new.uint);
});

it('store int', async function () {
  await Taylor.storeType(defs_new.int);
});

it('store array', async function () {
  await Taylor.storeType(defs_new.array);
});

it('store narray', async function () {
  await Taylor.storeType(defs_new.narray);
});

it('get uint', async function () {
  const resp = await Taylor.call('0xfffffffd11000000');
  expect(resp).toBe('0x' + defs_new.uint);
});

it('get int', async function () {
  const resp = await Taylor.call('0xfffffffd12000000');
  expect(resp).toBe('0x' + defs_new.int);
});

it('get array', async function () {
  const resp = await Taylor.call('0xfffffffd44000000');
  expect(resp).toBe('0x' + defs_new.array);
});

it('get narray', async function () {
  const resp = await Taylor.call('0xfffffffd45000000');
  expect(resp).toBe('0x' + defs_new.narray);
});

it('initialize uint', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff11000001');
  expect(resp).toBe('0xee000001000000051100000100');

  resp = await Taylor.call('0xffffffff11000008');
  expect(resp).toBe('0xee0000010000000c110000080000000000000000');

  resp = await Taylor.call('0xffffffff11000000ee0000010000000711000003000004');
  expect(resp).toBe('0xee000001000000081100000400000000');

  resp = await Taylor.call('0xffffffff11000000ee0000010000000711000003000020');
  expect(resp).toBe('0xee00000100000024110000200000000000000000000000000000000000000000000000000000000000000000');
});

it('initialize int', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff12000001');
  expect(resp).toBe('0xee000001000000051200000100');

  resp = await Taylor.call('0xffffffff12000000ee0000010000000711000003000004');
  expect(resp).toBe('0xee000001000000081200000400000000');

  resp = await Taylor.call('0xffffffff12000000ee0000010000000711000003000020');
  expect(resp).toBe('0xee00000100000024120000200000000000000000000000000000000000000000000000000000000000000000');
});

it('initialize array', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff44000000ee000002000000070000000f110000030000042200000411000004');
  expect(resp).toBe('0xee00000100000018440000041100000400000000000000000000000000000000');

  resp = await Taylor.call('0xffffffff44000000ee000002000000070000000f110000030000062200000411000004');
  expect(resp).toBe('0xee000001000000204400000611000004000000000000000000000000000000000000000000000000');

  resp = await Taylor.call('0xffffffff44000000ee000002000000070000000f110000030000042200000411000020');
  expect(resp).toBe('0xee0000010000008844000004110000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
});

it('initialize sized array', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff4400000411000004');
  expect(resp).toBe('0xee00000100000018440000041100000400000000000000000000000000000000');

  resp = await Taylor.call('0xffffffff4400000611000004');
  expect(resp).toBe('0xee000001000000204400000611000004000000000000000000000000000000000000000000000000');

  resp = await Taylor.call('0xffffffff4400000411000020');
  expect(resp).toBe('0xee0000010000008844000004110000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
});

it('initialize narray', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff45000000ee000003000000080000000f0000001d2200000411000000110000030000044400000211000003000002000005');
  expect(resp).toBe('0xee0000010000003445000002450000051100000400000000000000000000000000000000000000000000000000000000000000000000000000000000');

  resp = await Taylor.call('0xffffffff45000000ee000003000000080000000f0000001d2200000411000000110000030000044400000211000003000004000003');
  expect(resp).toBe('0xee0000010000003c450000044500000311000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
});

it('cast byte4 -> byte32', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff3333331cee000002000000080000001022000004220000202200000433333333');
  expect(resp).toBe('0xee00000100000024220000203333333300000000000000000000000000000000000000000000000000000000');
});

it('cast byte3 -> byte16', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff3333331cee0000020000000800000010220000042200001022000003444444');
  expect(resp).toBe('0xee000001000000142200001044444400000000000000000000000000');
});

it('cast u32 -> u256', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff3333331cee000002000000080000001022000004110000201100000400000001');
  expect(resp).toBe('0xee00000100000024110000200000000000000000000000000000000000000000000000000000000000000001');
});

it('cast u24 -> u128', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff3333331cee0000020000000800000010220000041100001011000003000008');
  expect(resp).toBe('0xee000001000000141100001000000000000000000000000000000008');
});

it('cast u32 -> i256', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff3333331cee000002000000080000001022000004120000201100000400000001');
  expect(resp).toBe('0xee00000100000024120000200000000000000000000000000000000000000000000000000000000000000001');
});

it('cast i32 -> u256', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff3333331cee000002000000080000001022000004110000201200000400000001');
  expect(resp).toBe('0xee00000100000024110000200000000000000000000000000000000000000000000000000000000000000001');
});

it('cast i32 -> u256', async function () {
  const resp = await Taylor.call('0xffffffff3333331cee0000020000000800000010220000041100002012000004ffffffff');
  // revert
});

it('cast u256 -> i32', async function () {
  const resp = await Taylor.call('0xffffffff3333331cee000002000000080000002c2200000412000004110000200000000000000000000000000000000000000000000000000000000000000001');
  expect(resp).toBe('0xee000001000000081200000400000001');
});

it('cast u256 -> i8', async function () {
  let resp;
  resp = await Taylor.call('0xffffffff3333331cee000002000000080000002c2200000412000001110000200000000000000000000000000000000000000000000000000000000000000001');
  expect(resp).toBe('0xee000001000000051200000101');

  resp = await Taylor.call('0xffffffff3333331cee000002000000080000002c220000041200000111000020000000000000000000000000000000000000000000000000000000000000007f');
  expect(resp).toBe('0xee00000100000005120000017f');

  resp = await Taylor.call('0xffffffff3333331cee000002000000080000002c2200000412000001110000200000000000000000000000000000000000000000000000000000000000000080');
  // revert
});

it('cast x -> i16', async function () {
  let resp;
  // u256 -> i16
  resp = await Taylor.call('0xffffffff3333331cee000002000000080000002c2200000412000002110000200000000000000000000000000000000000000000000000000000000000007f00');
  expect(resp).toBe('0xee00000100000006120000027f00');

  // u256 -> i16
  resp = await Taylor.call('0xffffffff3333331cee000002000000080000000d220000041200000212000001fa');
  expect(resp).toBe('0xee0000010000000612000002fffa');

  // i8 -> i16
  resp = await Taylor.call('0xffffffff3333331cee000002000000080000002c2200000412000002110000200000000000000000000000000000000000000000000000000000000000008000');
  // revert
});

it('cast array', async function () {
  await Taylor.storeType(defs_funcs.castarray);

  resp = await Taylor.call('0xffffffff77777777ee0000020000000c000000202200000844000003110000044400000312000004000000020000000500000004');
  expect(resp).toBe('0xee000001000000144400000311000004000000020000000500000004');

  resp = await Taylor.call('0xffffffff77777777ee0000020000000c000000202200000844000003110000084400000312000004000000020000000500000004');
  expect(resp).toBe('0xee000001000000204400000311000008000000000000000200000000000000050000000000000004');
});

it('cast array2', async function () {
  await Taylor.storeType(defs_funcs.castarray2);

  resp = await Taylor.call('0xffffffff77777788ee0000020000000c000000202200000844000003110000044400000312000004000000020000000500000004');
  expect(resp).toBe('0xee000001000000144400000311000004000000020000000500000004');

  resp = await Taylor.call('0xffffffff77777777ee0000020000000c000000202200000844000003110000204400000312000004000000020000000500000004');
  expect(resp).toBe('0xee000001000000684400000311000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000004');
});

it('named types', async function () {
  // named u32
  await Taylor.send('0xfffffffc88ffffffee000002000000040000001311000000ee0000010000000711000003000020');
  const resp = await Taylor.call('0xffffffff88ffffff');
  expect(resp).toBe('0xee00000100000024110000200000000000000000000000000000000000000000000000000000000000000000');
});

it('reduce', async function () {
  // [2, 5].reduce(prod, 1)
  const resp = await Taylor.call('0xffffffff33333331ee00000300000008000000160000001d2200000433333333440000021100000300000200000511000003000001');
  expect(resp).toBe('0xee000001000000071100000300000a');
});

it('curry', async function () {
  // [0x000003, 0x000002].map(concat(0x44)) -> [0x44000003, 0x44000002]
  await Taylor.send('0xfffffffe0000000566000000020000000000000015333333280000000300010233333332000000020403')
  const resp = await Taylor.call('0xffffffff66000000ee000004000000080000001000000015000000262200000433333330220000042200000422000001444400000311000003000003000002000005');
  expect(resp).toBe('0xee000001000000144400000322000004440000034400000244000005');
});

it('typed database', async function () {
  let resp;

  // insert typed value
  await Taylor.send('0xffffffff33333326ee0000010000000722000003777777')

  // get typed value
  resp = await Taylor.call('0xffffffff33333325ee000002000000080000001022000004220000031100000400000001');
  expect(resp).toBe('0xee0000010000000722000003777777');

  // count values per type
  resp = await Taylor.call('0xffffffff33333324ee000001000000081100000422000003');
  expect(resp).toBe('0xee000001000000081100000400000001');

  await Taylor.send('0xffffffff33333326ee000001000000072200000355555555')
  resp = await Taylor.call('0xffffffff33333324ee000001000000081100000422000003');
  expect(resp).toBe('0xee000001000000081100000400000002');

  resp = await Taylor.call('0xffffffff33333324ee000001000000081100000422000004');
  expect(resp).toBe('0xee000001000000081100000400000000');
});

it('pay', async function () {
  let resp;

  // send pay
  await Taylor.send('0xffffffff33333321ee000002000000180000003c11000014D32298893dD95c1Aaed8A79bc06018b8C265a279110000200000000000000000000000000000000000000000000000000de0b6b3a7640000')
  // TODO: check ETH balances

  await Taylor.send(`0xfffffffe0000000577777777050000002cee0000020000000800000020110000040000003211000014D32298893dD95c1Aaed8A79bc06018b8C265a279000000323333331d0000000201023333331e000000020104333333210000000203043333332100000002000533333334000000020607`)

  resp = await Taylor.send('0xffffffff77777777ee000002000000180000003c11000014fffFd05c2b12cfE3c74464531f88349e159785ea110000200000000000000000000000000000000000000000000000000de0b6b3a7640000');
  // TODO: check ETH balances
});
