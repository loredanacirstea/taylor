const ethers = require('ethers');
const compiledTaylor = require('../build/taylor.js');

const deployContract = signer => async compiled => {
  const transaction = {
    data: '0x' + compiled.evm.bytecode.object,
    gasLimit: 7000000,
    value: 0,
  };
  const response = await signer.sendTransaction(transaction);
  const receipt = await response.wait();
  console.log(`* Deployed Taylor: ${receipt.contractAddress} ; gas: ${receipt.gasUsed}`);

  if (compiled.abi) {
    return new ethers.Contract(receipt.contractAddress, compiled.abi, signer);
  }
  return receipt;
}

const deploy = (signer) => {
  return deployContract(signer)({evm: compiledTaylor});
}

module.exports = {
  deployContract,
  deploy,
}
