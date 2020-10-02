const ethers = require('ethers');

const deployContract = signer => async (compiled, args='') => {
  const transaction = {
    data: '0x' + compiled.evm.bytecode.object + args,
    gasLimit: 7500000,
    value: 0,
    gasPrice: 50 * (10**9),
  };
  const response = await signer.sendTransaction(transaction);
  const receipt = await response.wait();
  console.log(`* Deployed Taylor: ${receipt.contractAddress} ; gas: ${receipt.gasUsed}`);

  if (compiled.abi) {
    return new ethers.Contract(receipt.contractAddress, compiled.abi, signer);
  }
  return receipt;
}

const deployTaylorFromBuild = signer => {
  const compiledTaylor = require('../build/taylor.js');
  return deployContract(signer)({evm: compiledTaylor});
}

module.exports = {
  deployContract,
  deployTaylorFromBuild,
}
