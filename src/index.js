const taylor = require('./taylor.js');
const bootstrap_functions = require('./bootstrap.js');
const { deployTaylorFromBuild } = require('./deploy.js');
const tests = require('../tests/json_tests/index.js');
const tay = require('./v2/tay.js');

const deploy = async (provider, signer, ver=1) => {
    const receipt = await deployTaylorFromBuild(signer, ver);
    return taylor.getTaylor(provider, signer)(receipt.contractAddress, receipt.blockNumber);
}

taylor.bootstrap_functions = bootstrap_functions;
taylor.deploy = deploy;
taylor.tests = tests;
taylor.tay = tay;
module.exports = taylor;
