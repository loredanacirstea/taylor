const {deployContract} = require('./deploy.js');

const deployContractFromPath = signer => async (filePath, args) => {
    const { compileContract } = require('./build_utils.js');
    const compiled = await compileContract(filePath);
    if (!compiled) throw new Error('not compiled');
    return deployContract(signer)(compiled, args);
}

const deployTaylorFromPath = (signer) => async () => {
    return deployContractFromPath(signer)(TAYLOR_PATH);
}


module.exports = {
    deployContractFromPath,
    deployTaylorFromPath,
}
