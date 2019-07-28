import { AnyAction, Action } from 'redux';
import Tinlake, { Address } from 'tinlake';
import { ThunkAction } from 'redux-thunk';
import BN from 'bn.js';

// Actions
const LOAD = 'tinlake-ui/nft/LOAD';
const RECEIVE = 'tinlake-ui/nft/RECEIVE';
const NOT_FOUND = 'tinlake-ui/nft/NOT_FOUND';
const CLEAR = 'tinlake-ui/nft/CLEAR';

export interface NFT {
  tokenId: BN;
  nftOwner: Address;
  nftData: any;
}

export interface NFTState {
  state: null | 'loading' | 'not found' | 'found';
  nft: null | NFT;
}

const initialState: NFTState = {
  state: null,
  nft: null,
};

// Reducer
export default function reducer(state: NFTState = initialState,
                                action: AnyAction = { type: '' }): NFTState {
  switch (action.type) {
    case LOAD: return { ...state, state: 'loading', nft: null };
    case RECEIVE: return { ...state, state: 'found', nft: action.nft };
    case NOT_FOUND: return { ...state, state: 'not found', nft: null };
    case CLEAR: return { ...state, state: null, nft: null };
    default: return state;
  }
}

// keep internal counter to ensure a later query response is not overwritten by an earlier one
let sequence = 0;

export function getNFT(tinlake: Tinlake, tokenId: string):
  ThunkAction<Promise<void>, NFTState, undefined, Action> {
  return async (dispatch) => {
    sequence += 1;
    const mySequence = sequence;

    dispatch({ type: LOAD });

    const nftOwnerPromise = tinlake.ownerOfNFT(tokenId);
    const nftDataPromise = tinlake.getNFTData(tokenId);

    let nftOwner: Address;
    let nftData: any;

    try {
      nftOwner = await nftOwnerPromise;
    } catch (e) {
      if (sequence !== mySequence) { return; }

      console.error(`Could not get NFT owner for NFT ID ${tokenId}`, e);
      dispatch({ type: NOT_FOUND });
      return;
    }

    try {
      nftData = await nftDataPromise;
    } catch (e) {
      if (sequence !== mySequence) { return; }

      console.error(`Could not get NFT data for NFT ID ${tokenId}`, e);
      nftData = null;
    }

    if (sequence !== mySequence) { return; }

    const replacedTokenId = tokenId.replace(/^0x/, '');
    const bnTokenId = new BN(replacedTokenId);

    console.log('tokenId', tokenId, 'replaced', replacedTokenId,
                'bnTokenId', bnTokenId.toString(16));

    const nft: NFT = {
      nftOwner,
      nftData,
      tokenId: bnTokenId,
    };

    dispatch({ nft, type: RECEIVE });
  };
}

export function clearNFT():
  ThunkAction<Promise<void>, NFTState, undefined, Action> {
  return async (dispatch) => {
    sequence += 1;
    dispatch({ type: CLEAR });
  };
}
