import TAYLOR_GRAMMAR from 'taylor/taylor/taylor.ne';

const DEFAULT_CODE = '(add (mul 2 1 34 (add 13 56)) 9000)';

const STORAGE_KEY = 'TaylorGrammar';
const STORAGE_KEY_CODE = 'TaylorCode';
const STORAGE_KEY_TAYLOR_ADDRESS = 'TaylorInterpreterAddress';

const DEFAULT_DEPLOYMENT = {
  5777: {
    address: '0xCFF8dc8A5e2Af7fcc6BE124d3C91FA50186A8c96',
    block: 0,
  },
  3: {
    address: '0x7D4150f492f93e2eDD7FC0Fc62c9193b322f75e5',
    block: 0,
  },
}

const storeGrammar = source => {
  window.localStorage.setItem(STORAGE_KEY, source);
}

const getGrammar = () => {
  let source = window.localStorage.getItem(STORAGE_KEY);
  if (!source) {
    source = TAYLOR_GRAMMAR;
    window.localStorage.setItem(STORAGE_KEY, source);
  }
  return source;
}

const storeCode = source => {
  window.localStorage.setItem(STORAGE_KEY_CODE, source);
}

const getCode = () => {
  let source = window.localStorage.getItem(STORAGE_KEY_CODE);
  if (!source) {
    source = DEFAULT_CODE;
    window.localStorage.setItem(STORAGE_KEY_CODE, source);
  }
  return source;
}

const storeAddress = (chainid, address) => {
  const key = STORAGE_KEY_TAYLOR_ADDRESS + '_' + chainid;
  window.localStorage.setItem(key, address);
}

const getAddress = (chainid) => {
  const key = STORAGE_KEY_TAYLOR_ADDRESS + '_' + chainid;
  let addressData = {};
  addressData.address = window.localStorage.getItem(key);
  if (!addressData.address) {
    addressData = DEFAULT_DEPLOYMENT[chainid];
    window.localStorage.setItem(STORAGE_KEY_TAYLOR_ADDRESS, addressData.address);
  }
  return { ...addressData, block: addressData.block || 0 };
}

export {
  getGrammar,
  storeGrammar,
  storeCode,
  getCode,
  storeAddress,
  getAddress,
}
