const fs = require('fs')
const solc = require('solc')
require('./extensions.js');
const { getTaylor } = require('./index.js');

let cpath = __dirname.split('/');
cpath.pop();
const TAYLOR_PATH = cpath.join('/') + '/contracts/mal_like_tay.sol';

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

const compileTaylor = () => compileContract(TAYLOR_PATH);

const deployTaylor = (provider, signer) => async () => {
  const address = await deployContract(signer)(TAYLOR_PATH);
  return getTaylor(provider, signer)(address);
}

module.exports = {
  compileContract,
  deployContract,
  compileTaylor,
  deployTaylor,
}
