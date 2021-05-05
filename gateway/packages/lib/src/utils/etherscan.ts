import { BN } from 'ethereumjs-util';

const rootLink = `https://[[network]]etherscan.io`;
// This will be window for browsers and global for node


export const getSelectedNetwork = () => {
  const scope: any = window || global;
  return scope['__ETH_NETWORK__'] || 'mainnet';
};

export const getSubdomain = () => {
  const selectedNetwork = getSelectedNetwork();
  return selectedNetwork === 'mainnet' ? '' : `${selectedNetwork}.`;
  
};

export const getTransactionLink = (transaction) => {
  return `${rootLink.replace('[[network]]', getSubdomain())}/tx/${transaction}`;

};

export const getAddressLink = (address) => {
  return `${rootLink.replace('[[network]]', getSubdomain())}/address/${address}`;
};

export const getNFTLink = (tokenId, registyAddress) => {
  const tokenToInt = hexToInt(tokenId);
  return `${rootLink.replace('[[network]]', getSubdomain())}/token/${registyAddress}?a=${tokenToInt}`;
};

export const hexToInt = (hex: string) => {
  return new BN(hex.replace(/^0x/, ''), 16).toString();
};
