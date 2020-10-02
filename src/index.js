const taylor = require('./taylor.js');
const bootstrap_functions = require('./bootstrap.js');
const { deployTaylorFromBuild } = require('./deploy.js');
const tests = require('../tests/json_tests/index.js');
const defaultDeployment = require('./default_deployment.js');

const deploy = async (provider, signer) => {
    const receipt = await deployTaylorFromBuild(signer);
    return taylor.getTaylor(provider, signer)(receipt.contractAddress, receipt.blockNumber);
}

const defaultTaylor = async (provider, signer) => {
    const network = await provider.getNetwork();
    const deployment = defaultDeployment[network.chainId];
    return taylor.getTaylor(provider, signer)(deployment.address, deployment.block);
}

taylor.bootstrap_functions = bootstrap_functions;
taylor.deploy = deploy;
taylor.tests = tests;
taylor.default = defaultTaylor;
module.exports = taylor;
