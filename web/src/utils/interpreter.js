import { ethers } from 'ethers';

const sendTransaction = signer => address => async data => {
  const transaction = {
    data,
    gasLimit: 1000000,
    value: 0,
    to: address,
  };
  const response = await signer.sendTransaction(transaction);
  const receipt = await response.wait();
  if (receipt.status === 0) {
    throw new Error('Transaction failed');
  }
  return receipt;
}

const call = provider => address => async data => {
  let transaction = {
    to: address,
    data
  }
  return await provider.call(transaction);
}

const getStoredTypes = provider => async addressData => {
  // let topic = ethers.utils.id("nameRegistered(bytes32,address,uint256)");
  const topic =  '0x1111111111111111111111111111111111111111111111111111111111111111';

  const filter = {
    address: addressData.address,
    fromBlock: addressData.block,
    topics: [ topic ],
  }
  console.log('filter', filter);
  const result = await provider.getLogs(filter);
  return result.map(log => log.topics[1].substring(58));
}

const saveType = signer => address => async data => {
  console.log('saveType', data);
  sendTransaction(signer)(address)('0xfffffffe' + data)
}

const executeType = provider => address => async data => {
  return call(provider)(address)('0xffffffff' + data)
}

export {
  getStoredTypes,
  saveType,
  executeType,
}
