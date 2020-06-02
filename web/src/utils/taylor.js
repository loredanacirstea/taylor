const DEFAULT_CODE = '(add (mul 2 (add 13 56)) 9000)';
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

const addressKey = chainid => STORAGE_KEY_TAYLOR_ADDRESS + '_' + chainid;

const addAddress = (chainid, address, name) => {
  const key = addressKey(chainid);
  const addresses = getAddresses(chainid);
  addresses[name] = address;
  addresses.root = name;
  localStorage.setItem(key, JSON.stringify(addresses));
}

const getAddresses = (chainid) => {
  const key = addressKey(chainid);
  let addresses = localStorage.getItem(key);
  if (addresses) {
    addresses = JSON.parse(addresses);
  } else {
    addresses = DEFAULT_DEPLOYMENT[chainid] || {};
    localStorage.setItem(key, JSON.stringify(addresses));
  }
  return addresses;
}

const getNamedAddress = (chainid, name) => {
  const addresses = getAddresses(chainid);
  return addresses[name];
}

const clearAddresses = (chainid) => {
  const key = addressKey(chainid);
  localStorage.setItem(key, '{}');
}

export {
  storeCode,
  getCode,
  addAddress,
  getAddresses,
  getNamedAddress,
  clearAddresses,
}
