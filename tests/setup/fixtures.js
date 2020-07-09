const ethers = require('ethers');
const { compileContract, deployContract, deployTaylorFromPath } = require('../../src/build_utils.js');
const { malBackend } = require('../../src/taylor.js');

const PROVIDER_URL = 'http://192.168.1.140:8545';
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
// Getting the accounts
const signer = provider.getSigner(0);

module.exports = {
  provider,
  signer,
  compileContract,
  deployContract,
  deployTaylor: deployTaylorFromPath(provider, signer),
  getMalBackend: malBackend.getBackend,
}
