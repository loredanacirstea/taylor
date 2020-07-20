const taylor = require('./taylor.js');
const bootstrap_functions = require('./bootstrap.js');
const { deployTaylorFromBuild } = require('./deploy.js');
const tests = require('../tests/json_tests/index.js');

const deploy = async (provider, signer) => {
    const receipt = await deployTaylorFromBuild(signer);
    return taylor.getTaylor(provider, signer)(receipt.contractAddress, receipt.blockNumber);
}

taylor.bootstrap_functions = bootstrap_functions;
taylor.deploy = deploy;
taylor.tests = tests;
module.exports = taylor;
