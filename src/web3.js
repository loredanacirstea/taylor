const DEFAULT_TXOBJ = {
    gasLimit: 1000000,
    value: 0,
    gasPrice: 10
}
  
const sendTransaction = signer => address => async (data, txObj = {}) => {
    const transaction = Object.assign({}, DEFAULT_TXOBJ, txObj, {
        data,
        to: address,
    });
    const response = await signer.sendTransaction(transaction);
    response.wait().then(receipt => {
        if (receipt.status === 0) {
            throw new Error('Transaction failed');
        }
    })
    return response;
}

const call = provider => address => async (data, txObj = {}) => {
    const transaction = Object.assign({
        to: address,
        data,
    }, txObj);
    return await provider.call(transaction);
}
  
const getLogs = provider => address => async (topic, filter = {} ) => {
    const lastBlock = await provider.getBlockNumber();
    filter = Object.assign({
        address: address,
        topics: [ topic ],
        fromBlock: 0,
        toBlock: lastBlock,
    }, filter);
    return provider.getLogs(filter);
}

module.exports = { sendTransaction, call, getLogs };
