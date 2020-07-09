const compiledTaylor = require('../build/taylor.js');
const bootstrap_functions = require('./bootstrap.js');

const deployContract = signer => async compiled => {
    const transaction = {
      data: '0x' + compiled.evm.bytecode.object,
      gasLimit: 6000000,
      value: 0,
    };
    const response = await signer.sendTransaction(transaction);
    const receipt = await response.wait();
    console.log('* Deploy Taylor: ' + receipt.gasUsed);
    return receipt;
  }

const deploy = (signer) => {
    return deployContract(signer)(compiledTaylor);
}

const bootstrap = async (taylor, functions) => {
    functions = functions || Object.values(bootstrap_functions);
    for (let f of functions) {
        await taylor.sendAndWait(f);
    }
}

module.exports = {
    deployContract,
    deploy,
    bootstrap,
}
