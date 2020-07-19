const fs = require('fs')
const solc = require('solc')

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

const compileTaylor = () => compileContract(TAYLOR_PATH);
const compileTaylorAndWrite = () => {
  const BUILD_ROOT = __dirname + '/../build/taylor';
  const compiled = compileTaylor();
  return fs.promises.writeFile(BUILD_ROOT + '.js', `const Taylor = ${JSON.stringify(compiled.evm)}

module.exports = Taylor;
  `);
}

module.exports = {
  compileContract,
  compileTaylor,
  compileTaylorAndWrite,
}
