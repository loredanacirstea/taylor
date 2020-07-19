const ethers = require('ethers');
const { deployContractFromPath } = require('../../src/deploy.js');
const { compileTaylorAndWrite } = require('../../src/build_utils.js');
const taylor = require('../../src/index.js');

const PROVIDER_URL = 'http://192.168.1.140:8545';
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
// Getting the accounts
const signer = provider.getSigner(0);

let test_call_path = __dirname.split('/');
test_call_path.pop();
test_call_path = test_call_path.join('/') + '/contracts/TestCallSend.sol';
const getTestCallContract = () => deployContractFromPath(signer)(test_call_path);

taylor.deployRebuild = async () => {
  await compileTaylorAndWrite();
  return taylor.deploy(provider, signer);
}

module.exports = {
  provider,
  signer,
  taylor,
  getTestCallContract,
}
