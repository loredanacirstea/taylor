const ethers = require('ethers');
const { deployContractFromPath } = require('../../src/deploy.js');
const { compileTaylorAndWrite } = require('../../src/build_utils.js');
const taylor = require('../../src/index.js');

const PROVIDER_URL = 'http://192.168.1.140:8545';
const provider = new ethers.providers.JsonRpcProvider();
// Getting the accounts
const signer = provider.getSigner(0);

let test_contracts_path = __dirname.split('/');
test_contracts_path.pop();
test_contracts_path = test_contracts_path.join('/') + '/contracts/';
const getTestCallContract = () => deployContractFromPath(signer)(test_contracts_path + 'TestCallSend.sol');
const getTestPipeContracts = async () => {
  const vr = await deployContractFromPath(signer)(test_contracts_path + 'VendorRegistration.sol');
  const vp = await deployContractFromPath(signer)(test_contracts_path + 'VendorPrices.sol');
  const args = ethers.utils.defaultAbiCoder.encode(['address', 'address'], [vr.address, vp.address]);
  const mp = await deployContractFromPath(signer)(test_contracts_path + 'MarketPlace.sol', args.substring(2));
  console.log('***** PIPE example', vr.address, vp.address, mp.address);
  return { vr, vp, mp };
}

taylor.deployRebuild = async (ver=1) => {
  await compileTaylorAndWrite();
  return taylor.deploy(provider, signer, ver);
}

module.exports = {
  provider,
  signer,
  taylor,
  getTestCallContract,
  getTestPipeContracts,
}
