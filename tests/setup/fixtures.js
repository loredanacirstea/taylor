const fs = require('fs')
const solc = require('solc')
const ethers = require('ethers');
const BN = require('bn.js');
require('../../src/extensions.js');
const { decode, expr2h, getTaylor } = require('../../src/index.js');
const mal = require('../../src/mal_backend.js');

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
  const yulsource = fs.readFileSync(filePath).toString();
  const output = JSON.parse(solc.compile(solcData(yulsource)));

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
    gasLimit: 6000000,
    value: 0,
  };
  const response = await signer.sendTransaction(transaction);
  const receipt = await response.wait();
  console.log('* Deploy ' + filePath + ': ' + receipt.gasUsed);
  return receipt.contractAddress;
}

const _getTaylor = async () => {
  const address = await deployContract(signer)(MALLT_PATH);
  return getTaylor(provider, signer)(address);
}


module.exports = {
  provider,
  signer,
  compileContract,
  deployContract,
  getTaylor: _getTaylor,
  getMalBackend: mal.getBackend,
}
