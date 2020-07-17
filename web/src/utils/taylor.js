const DEFAULT_CODE = '(add (mul 2 (add 13 56)) 9000)';
const STORAGE_KEY_CODE = 'TaylorCode';
const STORAGE_KEY_TAYLOR_ADDRESS = 'TaylorInterpreterAddress';
const STORAGE_KEY_CONFIG = 'TaylorConfig';

const DEFAULT_DEPLOYMENT = {
  5777: {
    contract1: '0x404a757f81e9256ce798e0e7cfc3917e0afc2cdd',
    root: 'contract1'
  },
  1337: {
    contract1: '0x404a757f81e9256ce798e0e7cfc3917e0afc2cdd',
    root: 'contract1'
  },
  3: {
    contract1: '0xc6743db47ce3702599820282940c3561b2269556',
    root: 'contract1',
  },
  42: {
    contract1: '0xee0c10d568c9772892aab27c3fc14d7033658833',
    root: 'contract1',
  },
  4: {
    contract1: '0x19c08c750420af47059e68888b0f6a32698d0928',
    root: 'contract1',
  },
  5: {
    contract1: '0x5d6aa1a248655f76917bb97a7fef24dd40aa2b6d',
    root: 'contract1',
  },
}

const DEPL_BLOCKS = {
  5777: 0,
  3: 8036099,
  42: 18899976,
  4: 6616106,
  5: 2823431,
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
  DEPL_BLOCKS,
  DEFAULT_DEPLOYMENT,
}
