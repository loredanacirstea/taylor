const getLogs = provider => address => async topic => {
    const filter = {
        address: address,
        topics: [ topic ],
        fromBlock: 0,
        toBlock: 'latest',
    }
    return provider.getLogs(filter);
}

const getStoredFunctions = getLogs => async () => {
    const topic = '0x00000000000000000000000000000000000000000000000000000000ffffffff';
    const logs = await getLogs(topic);

    return logs.map(log => {
        log.name = log.topics[1].substring(2).hexDecode();
        log.signature = '0x' + log.topics[2].substring(58);
        return log;
    });
}

  
const call = provider => address => async data => {
    let transaction = {
        to: address,
        data
    }
    return await provider.call(transaction);
}
  
const sendTransaction = signer => address => async data => {
    const transaction = {
        data,
        gasLimit: 1000000,
        value: 0,
        to: address,
        gasPrice: 21,
    };
    const response = await signer.sendTransaction(transaction);
    return response;
}

const web3util = (provider, signer) => {
    return address => {
        return {
            call: call(provider)(address),
            send: sendTransaction(signer)(address),
            getLogs: getLogs(provider)(address),
            getFns: getStoredFunctions(getLogs(provider)(address)),
        }
    }
}

module.exports = {
    getLogs,
    getStoredFunctions,
    call,
    sendTransaction,
    web3util,
}
