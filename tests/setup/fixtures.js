const ethers = require('ethers');
const { compileContract, deployContract, deployTaylorFromPath, deployContractFromPath } = require('../../src/build_utils.js');
const { malBackend } = require('../../src/taylor.js');

const PROVIDER_URL = 'http://192.168.1.140:8545';
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
// Getting the accounts
const signer = provider.getSigner(0);

let test_call_path = __dirname.split('/');
test_call_path.pop();
test_call_path = test_call_path.join('/') + '/contracts/TestCallSend.sol';
const getTestCallContract = () => deployContractFromPath(signer)(test_call_path);

module.exports = {
  provider,
  signer,
  compileContract,
  deployContract,
  deployTaylor: deployTaylorFromPath(provider, signer),
  getMalBackend: malBackend.getBackend,
  getTestCallContract,
}
