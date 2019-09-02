import config from './config';
import { BN } from 'ethereumjs-util';

const rootLink = `https://[[network]]etherscan.io/`;

const subdomain = config.ethNetwork === 'mainnet' ? '' : `${config.ethNetwork}.`;


export const getTransactionLink = (transaction) => {
  return `${rootLink.replace('[[network]]', subdomain)}/tx/${transaction}`;

};

export const getAddressLink = (address) => {
  return `${rootLink.replace('[[network]]', subdomain)}/address/${address}`;
};

export const getNFTLink = (tokenId, registyAddress) => {
  const tokenToInt = new BN(tokenId.replace(/^0x/, ''), 16).toString();
  return `${rootLink.replace('[[network]]', subdomain)}/token/${registyAddress}?a=${tokenToInt}`;
};
