const fs = require('fs')
const solc = require('solc')
const ethers = require('ethers');
const yulp = require('yulp');
const BN = require('bn.js');
require('../../src/extensions.js');
const { decode, expr2h } = require('../../src/index.js');
const mal = require('../../src/mal_extension.js');

const PROVIDER_URL = 'http://192.168.1.140:8545';
const MALLT_PATH = './contracts/mal_like_tay.sol';


const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
// Getting the accounts
const signer = provider.getSigner(0);

const solcData = yulsource => JSON.stringify({
  language: 'Yul',
  sources: { 'input.yul': { content: yulsource } },
  settings: {
    outputSelection: { '*': { '*': ['*'], '': ['*'] } },
    optimizer: { enabled: true, details: { yul: true } },
  },
});

const compileContract = filePath => {
  const yulpsource = fs.readFileSync(filePath).toString();

  const yulpCompiled = yulp.compile(yulpsource);
  const yulpResult = yulp.print(yulpCompiled.results).replace(/\./g, "_");
  const output = JSON.parse(solc.compile(solcData(yulpResult)));

  if (output.errors.length > 1 || !output.contracts) {
    const message = output.errors.map(err => err.formattedMessage).join('\n');
    throw new Error(message)
  }

  return Object.values(output.contracts['input.yul'])[0];
}

const deployContract = signer => async filePath => {
  const compiled = compileContract(filePath);
  if (!compiled) throw new Error('not compiled');
  const transaction = {
    data: '0x' + compiled.evm.bytecode.object,
    gasLimit: 5000000,
    value: 0,
  };
  const response = await signer.sendTransaction(transaction);
  const receipt = await response.wait();
  return receipt.contractAddress;
}

const sendTransaction = signer => address => async (data, txObj = {}) => {
  const transaction = Object.assign({
    data,
    gasLimit: 1000000,
    value: 0,
    to: address,
    gasPrice: 10
  }, txObj);
  const response = await signer.sendTransaction(transaction);
  const receipt = await response.wait();
  if (receipt.status === 0) {
    throw new Error('Transaction failed');
  }
  return receipt;
}

const call = provider => address => async (data, txObj = {}) => {
  const transaction = Object.assign({
    to: address,
    data
  }, txObj);
  return await provider.call(transaction);
}

const getLogs = provider => address => async topic => {
  const filter = {
    address: address,
    topics: [ topic ],
    fromBlock: 0,
    toBlock: 'latest',
  }
  return provider.getLogs(filter);
}

const getStoredFunctions = getLogs => async () => {
  const topic = '0x00000000000000000000000000000000000000000000000000000000ffffffff';
  const logs = await getLogs(topic);

  return logs.map(log => {
    log.name = log.topics[1].substring(2).hexDecode();
    log.signature = '0x' + log.topics[2].substring(58);
    return log;
  });
}

const getTaylor = async () => {
  const address = await deployContract(signer)(MALLT_PATH);
  const interpreter = {
    address: address.toLowerCase(),
    send_raw: sendTransaction(signer)(address),
    call_raw: call(provider)(address),
    getLogs: getLogs(provider)(address),
    getStoredFunctions: getStoredFunctions(getLogs(provider)(address)),
    provider,
    signer,
  }

  interpreter.call = async mal_expression => decode(await interpreter.call_raw(expr2h(mal_expression)));
  interpreter.send = async mal_expression => interpreter.send_raw(expr2h(mal_expression));

  return interpreter;
}

const getMalBackend = () => {
  const dec = bnval => {
    bnval = new BN(bnval._hex.substring(2), 16);
    return bnval.lt(new BN(2).pow(new BN(16))) ? bnval.toNumber() : bnval;
  }
  return {
    call: mal_expression => dec(mal.re(mal_expression)),
  }
}

module.exports = {
  provider,
  signer,
  compileContract,
  deployContract,
  getTaylor,
  getMalBackend,
}
