import BN from 'bn.js';
import Tinlake, { Address } from 'tinlake';

export interface NFT {
  tokenId: BN;
  nftOwner: Address;
  nftData: any;
}

export async function getNFT(tinlake: Tinlake, tokenId: string) {

  let nftOwnerPromise;
  let nftDataPromise;
  try {
    nftOwnerPromise = await tinlake.ownerOfNFT(tokenId);
    nftDataPromise = await tinlake.getNFTData(tokenId);
  } catch (e)
  {
    console.log(`NFT Data not supported ${tokenId}`, e);
  }

  let nftOwner: Address;
  let nftData: any;

  try {
    nftOwner = await nftOwnerPromise;
  } catch (e) {
    return loggedError(e, 'Could not get NFT owner for NFT ID', tokenId);
  }

  if (!nftOwner) {
    return loggedError(null, 'Could not get NFT owner for NFT ID', tokenId);
  }

  try {
    nftData = await nftDataPromise;
  } catch (e) {
    return loggedError(e, 'Could not get NFT data for NFT ID', tokenId);
  }

  const replacedTokenId = tokenId.replace(/^0x/, '');
  const bnTokenId = new BN(replacedTokenId);

  const nft: NFT = {
    nftOwner,
    nftData,
    tokenId: bnTokenId
  };

  return {
    nft,
    tokenId
  };
}

function loggedError(error: any, message: string, tokenId: string) {
  console.log(`${message} ${tokenId}`, error);
  return {
    errorMessage: `${message} ${tokenId}`,
    tokenId
  };
}
