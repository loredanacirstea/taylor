const fs = require('fs')
const solc = require('solc')
const ethers = require('ethers');
const yulp = require('yulp');

const PROVIDER_URL = 'http://192.168.1.140:8545';
const CPATH = './contracts/dtypeinterpreter.tay';
const CPATH2 = './tests/dtypeinterpreter_2.tay';
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

const sendTransaction = signer => address => async data => {
  const transaction = {
    data,
    gasLimit: 1000000,
    value: 0,
    to: address,
  };
  const response = await signer.sendTransaction(transaction);
  const receipt = await response.wait();
  if (receipt.status === 0) {
    throw new Error('Transaction failed');
  }
  return receipt;
}

const call = provider => address => async data => {
  let transaction = {
    to: address,
    data
  }
  return await provider.call(transaction);
}

const deployTaylor = (instance_type = 0) => {
  switch (instance_type) {
    case 0:
      return deployContract(signer)(CPATH);
    case 1:
      return deployContract(signer)(CPATH2);
    default:
      throw new Error('No other Taylor instances found.');
  }
}

const getTaylor = async (instance_type = 0) => {
  const taylorAddress = await deployTaylor(instance_type);
  return {
    address: taylorAddress.toLowerCase(),
    send: sendTransaction(signer)(taylorAddress),
    call: call(provider)(taylorAddress),
    storeType: data => sendTransaction(signer)(taylorAddress)('0xfffffffe' + data),
    register: address => sendTransaction(signer)(taylorAddress)('0xfffffff9' + '11000014' + address.substring(2)),
  }
}

const getMalTay = async () => {
  const address = await deployContract(signer)(MALLT_PATH);
  return {
    address: address.toLowerCase(),
    send: sendTransaction(signer)(address),
    call: call(provider)(address),
  }
}


module.exports = {
  provider,
  signer,
  compileContract,
  deployContract,
  deployTaylor,
  getTaylor,
  getMalTay,
}
