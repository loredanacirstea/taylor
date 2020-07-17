const fs = require('fs')
const solc = require('solc')
require('./extensions.js');
const { getTaylor } = require('./taylor.js');
const { deployContract } = require('./deploy.js');

let cpath = __dirname.split('/');
cpath.pop();
const TAYLOR_PATH = cpath.join('/') + '/contracts/mal_like_tay.sol';

const solcDataYul = yulsource => JSON.stringify({
  language: 'Yul',
  sources: { 'contract_source': { content: yulsource } },
  settings: {
    outputSelection: { '*': { '*': ['*'], '': ['*'] } },
    optimizer: { enabled: true, details: { yul: true } },
  },
});

var solcDataSol = source => JSON.stringify({
  language: 'Solidity',
  sources: { 'contract_source': { content: source } },
  settings: {
    outputSelection: { '*': { '*': ['*'] } },
  }
});

const compileContract = filePath => {
  const source = fs.readFileSync(filePath).toString();
  let solcData = solcDataYul;
  
  if (!filePath.includes('tay.sol')) {
    solcData = solcDataSol;
  }
  
  const output = JSON.parse(solc.compile(solcData(source)));

  if (output.errors.length > 1 || !output.contracts) {
    const message = output.errors.map(err => err.formattedMessage).join('\n');
    throw new Error(message)
  }

  return Object.values(output.contracts['contract_source'])[0];
}

const deployContractFromPath = signer => async filePath => {
  const compiled = compileContract(filePath);
  if (!compiled) throw new Error('not compiled');
  return deployContract(signer)(compiled);
}

const compileTaylor = () => compileContract(TAYLOR_PATH);

const deployTaylorFromPath = (provider, signer) => async () => {
  const receipt = await deployContractFromPath(signer)(TAYLOR_PATH);
  return getTaylor(provider, signer)(receipt.contractAddress);
}

module.exports = {
  compileContract,
  deployContract,
  deployContractFromPath,
  compileTaylor,
  deployTaylorFromPath,
}
