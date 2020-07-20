const DEFAULT_CODE = '(add (mul 2 (add 13 56)) 9000)';
const STORAGE_KEY_CODE = 'TaylorCode';
const STORAGE_KEY_TAYLOR_ADDRESS = 'TaylorInterpreterAddress';
const STORAGE_KEY_CONFIG = 'TaylorConfig';

const DEFAULT_DEPLOYMENT = {
  5777: {
    contract1: '0x47f523ce1c4b428045af98e1de2fc41ce642b00c',
    root: 'contract1',
    block: 0,
  },
  1337: {
    contract1: '0x47f523ce1c4b428045af98e1de2fc41ce642b00c',
    root: 'contract1',
    block: 0,
  },
  3: {
    contract1: '0x2ff70a3c3c39d89b7bc5417b1ca2425a771efc9f',
    root: 'contract1',
    block: 8331339,
  },
  42: {
    contract1: '0xd6866368fcbe89bf10acf948bc5eb19b01e4df82',
    root: 'contract1',
    block: 19705047,
  },
  4: {
    contract1: '0x19c08c750420af47059e68888b0f6a32698d0928',
    root: 'contract1',
    block: 6616106,
  },
  5: {
    contract1: '0xb24404e0d1be660f37ebf577d6a56581703d594b',
    root: 'contract1',
    block: 3078473,
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
  let addresses;
  // let addresses = localStorage.getItem(key);
  // if (addresses) {
  //   addresses = JSON.parse(addresses);
  //   addresses = Object.assign((DEFAULT_DEPLOYMENT[chainid] || {}), addresses);
  // } else {
    addresses = DEFAULT_DEPLOYMENT[chainid] || {};
    localStorage.setItem(key, JSON.stringify(addresses));
  // }
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

const setConfig = config => {
  let _config = getConfig();
  config = Object.assign({}, _config, config);
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
}

const getConfig = () => {
  let config = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (!config) config = '{}';
  return JSON.parse(config);
}

export {
  storeCode,
  getCode,
  addAddress,
  getAddresses,
  getNamedAddress,
  clearAddresses,
  setConfig,
  getConfig,
  DEFAULT_DEPLOYMENT,
}
