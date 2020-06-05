const fs = require('fs')
const solc = require('solc')
const yulp = require('yulp');

const CPATH = './contracts/mal_like_tay.sol';
const BUILD_ROOT = './build/maltay';

const solcData = yulsource => JSON.stringify({
  language: 'Yul',
  sources: { 'input.yul': { content: yulsource } },
  settings: {
    outputSelection: { '*': { '*': ['*'], '': ['*'] } },
    optimizer: { enabled: true, details: { yul: true } },
  },
});

const build = (filePath, buildRoot) => {
  const yulpsource = fs.readFileSync(filePath).toString();
  const yulpCompiled = yulp.compile(yulpsource);
  const yulpResult = yulp.print(yulpCompiled.results).replace(/\./g, "_");
  fs.promises.writeFile(buildRoot + '.yul', yulpResult);

  const output = JSON.parse(solc.compile(solcData(yulpResult)));

  if (output.errors.length > 1 || !output.contracts) {
    const message = output.errors.map(err => err.formattedMessage).join('\n');
    throw new Error(message)
  }
  fs.promises.writeFile(buildRoot + '.json', JSON.stringify(output.contracts['input.yul']));
  return Object.values(output.contracts['input.yul'])[0];
}

build(CPATH, BUILD_ROOT);
