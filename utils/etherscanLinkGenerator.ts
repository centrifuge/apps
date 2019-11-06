
import BN from 'bn.js';
import config from '../config'

const { etherscanUrl } = config
export const getAddressLink = (address: string) => {
  return `${etherscanUrl}/address/${address}`;
};
  
export const getNFTLink = (tokenId: string, registyAddress: string) => {
  const tokenToInt = hexToInt(tokenId);
  return `${etherscanUrl}/token/${registyAddress}?a=${tokenToInt}`;
};
  
export const hexToInt = (hex: string) => {
  return new BN(hex.replace(/^0x/, ''), 16).toString();
};
  