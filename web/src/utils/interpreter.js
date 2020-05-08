import { ethers } from 'ethers';

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

export {
  getStoredTypes,
}
