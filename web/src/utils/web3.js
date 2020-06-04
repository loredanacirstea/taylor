import { ethers } from 'ethers';

const connect = async () => {
    if (window.ethereum) {
        try {
            // eslint-disable-next-line
            await ethereum.enable();
        } catch (error) {
            console.log('User rejected dApp connection');
        }
    } 
};

const getProvider = async () => {
  await connect();
  if (window.web3 && window.web3.currentProvider) {
    // eslint-disable-next-line
    const provider = new ethers.providers.Web3Provider(web3.currentProvider);
    const signer = provider.getSigner(0);
    return { provider, signer };
  }
  return {};
}

export {
  getProvider,
}
