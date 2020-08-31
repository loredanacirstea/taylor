const fs = require('fs')
const { exec } = require("child_process");
const solc = require('solc')
const evmasm = require('evmasm');

let cpath = __dirname.split('/');
cpath.pop();
const TAYLORv1_PATH = cpath.join('/') + '/contracts/taylor_v1.sol';
const TAYLORv2_PATH = cpath.join('/') + '/contracts/taylor_v2.sol';
const TAYLORv3_PATH = cpath.join('/') + '/contracts/taylor_v3.asm';

const solc_command_yul = 'solc --strict-assembly --optimize --yul-optimizations ""';

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

const compileCli = filePath => new Promise((resolve, reject) => {
  const command = solc_command_yul + ' ' + filePath;
  console.log('Running command: ', command);
  exec(command, {maxBuffer: 500 * 1024}, (error, stdout, stderr) => {
      const errors = [];
      if (error) {
          console.log(`error: ${error.message}`);
          // reject(error);
          errors.push(error);
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          errors.push(stderr);
      }
      const output = parseCompilerOutput(stdout);
      output.errors = errors;
      resolve(output);
  });
});

function parseCompilerOutput(str) {
  const bin = str.match(/Binary representation:\n(.*)\n/)[1];
  const asm = str.match(/Text representation:\n((.*\n*)*)/);
  return { contracts: {contract_source: [{evm: { bytecode: {object: bin}}, asm: asm[1] }]}};
}

const compileContract = async filePath => {
  const source = fs.readFileSync(filePath).toString();
  let solcData = solcDataYul;
  let output = {errors: []};
  console.log('filePath', filePath)

  if (filePath.includes('.asm')) {
    output.contracts = {contract_source: [{evm: {bytecode: {object: evmasm.compile(source)}}}]};
  } else if (!filePath.match(/taylor_v\d.sol/)) {
    solcData = solcDataSol;
    output = JSON.parse(solc.compile(solcData(source)));
  } else {
    // output = await compileCli(filePath);
    output = JSON.parse(solc.compile(solcData(source)));
    // console.log('(***** output', JSON.stringify(output));
  }

  if (output.errors.length > 0 || !output.contracts) {
    const message = output.errors.map(err => err.formattedMessage || err.message || err).join('\n');
    const iserror = output.errors.find(err => (err.formattedMessage || err.message || err).match(/error/i));
    // const warnings = output.errors.filter(err => err.formattedMessage.match(/warning/i));
    console.log('message', message);
    if (iserror) throw new Error(message);
  }
  // console.log('output', output.contracts['contract_source'][0].asm);

  return Object.values(output.contracts['contract_source'])[0];
}

const compileTaylor = async () => {
  return {
    v1: await compileContract(TAYLORv1_PATH),
    v2: await compileContract(TAYLORv2_PATH),
    v3: await compileContract(TAYLORv3_PATH),
  }
}
const compileTaylorAndWrite = async () => {
  const BUILD_ROOT = __dirname + '/../build/taylor';
  const compiled = await compileTaylor();
  await fs.promises.writeFile(BUILD_ROOT + '_v1.js', `const Taylor = ${JSON.stringify(compiled.v1.evm)}

module.exports = Taylor;
  `);

  await fs.promises.writeFile(BUILD_ROOT + '_v2.js', `const Taylor = ${JSON.stringify(compiled.v2.evm)}

module.exports = Taylor;
  `);

  await fs.promises.writeFile(BUILD_ROOT + '_v3.js', `const Taylor = ${JSON.stringify(compiled.v3.evm)}

module.exports = Taylor;
  `);
}

module.exports = {
  compileContract,
  compileTaylor,
  compileTaylorAndWrite,
}
