import { BN } from 'ethereumjs-util';

const rootLink = `https://[[network]]etherscan.io`;
// This will be window for browsers and global for node
const scope:any = window || global;
const selectedNetwork = scope['__ETH_NETWORK__'] || 'mainnet';

const subdomain = selectedNetwork === 'mainnet' ? '' : `${selectedNetwork}.`;


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
