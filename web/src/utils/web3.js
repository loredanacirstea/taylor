import { ethers } from 'ethers';

const getProvider = async () => {
  if(window.ethereum) {
    let provider, signer;
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum)
    } catch(e) {
      console.log('Use a web3-enabled wallet.')
    }
    if (provider) signer = provider.getSigner(0);
    return { provider, signer };
  }
  return {};
}

export {
  getProvider,
}
