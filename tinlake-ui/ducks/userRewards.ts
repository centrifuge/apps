import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config from '../config'
import Apollo from '../services/apollo'
import { centChainService } from '../services/centChain'

// Actions
const LOAD_SUBGRAPH = 'tinlake-ui/user-rewards/LOAD_SUBGRAPH'
const RECEIVE_SUBGRAPH = 'tinlake-ui/user-rewards/RECEIVE_SUBGRAPH'
const LOAD_CENT_CHAIN = 'tinlake-ui/user-rewards/LOAD_CENT_CHAIN'
const RECEIVE_CENT_CHAIN = 'tinlake-ui/user-rewards/RECEIVE_CENT_CHAIN'
const LOAD_CENT_CHAIN_CONNECTED = 'tinlake-ui/user-rewards/LOAD_CENT_CHAIN_CONNECTED'
const RECEIVE_CENT_CHAIN_CONNECTED = 'tinlake-ui/user-rewards/RECEIVE_CENT_CHAIN_CONNECTED'
const LOAD_GCP = 'tinlake-ui/user-rewards/LOAD_GCP'
const RECEIVE_GCP = 'tinlake-ui/user-rewards/RECEIVE_GCP'

// just used for readability
type AccountIDString = string
type BigDecimalString = string
type BigIntString = string

export interface UserRewardsState {
  subgraphState: null | 'loading' | 'found'
  centChainState: null | 'loading' | 'found'
  gcpState: null | 'loading' | 'found'
  data: null | UserRewardsData
  collectionState: null | 'loading' | 'found'
  collectionData: null | UserRewardsCollectionData
}

// Process to earn and claim rewards:
// 1. User earns rewards on Ethereum for any investments on that Ethereum address `totalRewards`
// 2. After holding a non zero investements for 60 days, those rewards become `claimable`
// 3. To claim rewards, user needs to link a Cent Chain account to the Ethereum address. If there is none, any rewards are in `unlinkedRewards`. If there is a link, rewards will be fully assigned to the linked Cent Chain account.
// 4. For those linked rewards to be claimable on Cent Chain, the amounts and balances are once day put into a merkle tree, whiches root will be stored on Cent Chain, and whiches leaves will be uploaded to GCP into a storage bucket. Once the rewards are in the bucket and the root hash lives on Cent Chain, they can become claimable.
// 5. User can now claim the rewards on Cent Chain.
// 6. Claimed rewards can be queried from cent chain.
export interface UserRewardsData {
  // TODO consolidate all data into this data type
  nonZeroInvestmentSince: BigIntString // From subgraph. if null, the user has not had any investments yet. if the user invested any amount, this number will be positive.
  claimable: boolean // From subgraph. Determines whether investment was long enough on Ethereum yet for rewards to be claimable.
  unlinkedRewards: BigDecimalString // From subgraph. Those are rewards that have not been linked to a Cent Chain account on Ethereum. They can be linked at any time. If claimable is true, they will be immediately assigned to a linked Cent Chain account. If claimable is false, they will remain unlinked until a link is established.
  totalEarnedRewards: BigDecimalString // From subgraph. Rewards earned on Ethereum across all links for this Ethereum address so far, might be claimable, might have been claimed. Should equal the sum of links.earned and unlinkedRewards
  links: UserRewardsLink[]
  totalClaimableRewards: BigDecimalString | null // Derived: Sum of links.claimable. `null` if data has not been received yet.
  totalClaimedRewards: BigDecimalString | null // Derived: Sum of links.claimed. `null` if data has not been received yet.
  totalUnclaimedClaimableRewards: BigDecimalString | null // Dervied: totalClaimableRewards - totalClaimedRewards. Will be positive if new rewards have been added to GCP that have not been claimed yet on Cent Chain.
}

export interface UserRewardsLink {
  centAccountID: AccountIDString // From subgraph. Cent Chain account that has been linked and can receive any funds
  earned: BigDecimalString // From subgraph. Amount of rewards that have been collected on Ethereum and have been assigned to this link/Cent Chain account. Any new rewards earned by any user will be added to the latest link once per day.
  // TODO: the following are wrong if there are multiple Ethereum addresses linked to the same Cent Chain account. Remove them into the separate state UserRewardsCollectedData, and rename UserRewardsData into EarnedData
  claimable: BigDecimalString | null // From stored tree of rewards in rad-rewards-trees GCP bucket. Once per day, all Cent Chain account IDs and their respective earned rewards will be put into a merkle tree, the root is stored on Centrifuge Chain and the tree leaves are uploaded to GCP. `null` if data has not been received yet.
  claimed: BigDecimalString | null // From Centrifuge Chain. Amount that has already been claimed by a user on Centrifuge Chain. `null` if data has not been received yet.
}

export interface UserRewardsCollectionData {
  centAccountID: string
  collectable: BigIntString | null
  collected: BigIntString | null
}

const initialState: UserRewardsState = {
  subgraphState: null,
  centChainState: null,
  gcpState: null,
  data: null,
  collectionState: null,
  collectionData: null,
}

export default function reducer(
  state: UserRewardsState = initialState,
  action: AnyAction = { type: '' }
): UserRewardsState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.userRewards || {}) }
    case LOAD_SUBGRAPH:
      return { ...state, subgraphState: 'loading' }
    case RECEIVE_SUBGRAPH:
      return { ...state, subgraphState: 'found', data: action.data }
    case LOAD_CENT_CHAIN:
      return { ...state, centChainState: 'loading' }
    case RECEIVE_CENT_CHAIN:
      return {
        ...state,
        centChainState: 'found',
        data: state.data
          ? { ...state.data, links: state.data.links.map((l, i) => ({ ...l, claimed: action.data[i] })) }
          : null,
      }
    case LOAD_CENT_CHAIN_CONNECTED:
      return {
        ...state,
        collectionState: 'loading',
        collectionData: { centAccountID: action.centAccountID, collectable: null, collected: null },
      }
    case RECEIVE_CENT_CHAIN_CONNECTED:
      return {
        ...state,
        collectionState: 'found',
        collectionData: {
          ...state.collectionData!,
          collected: action.data,
        },
      }
    case LOAD_GCP:
      return { ...state, gcpState: 'loading' }
    case RECEIVE_GCP:
      return {
        ...state,
        gcpState: 'found',
        data: state.data
          ? {
              ...state.data,
              links: state.data.links.map((l) => ({
                ...l,
                claimable:
                  (action.data as { accountID: string; balance: string }[]).find(
                    (ad) => ad.accountID === l.centAccountID
                  )?.balance || '0',
              })),
            }
          : null,
        collectionData: state.collectionData
          ? {
              ...state.collectionData,
              collectable:
                (action.data as { accountID: string; balance: string }[]).find(
                  (ad) => ad.accountID === state.collectionData?.centAccountID
                )?.balance || '0',
            }
          : null,
      }
    default:
      return state
  }
}

export function load(
  address: string
): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch) => {
    await dispatch(loadSubgraph(address)) // block, need data for next two loads
    dispatch(loadCentChain())
    dispatch(loadClaimsTree())
  }
}

export function loadSubgraph(
  address: string
): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_SUBGRAPH })
    const data = await Apollo.getUserRewards(address)
    dispatch({ data, type: RECEIVE_SUBGRAPH })
  }
}

export function loadCentChain(): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { userRewards } = getState()

    if (userRewards.data === null) {
      return
    }

    dispatch({ type: LOAD_CENT_CHAIN })
    const data = await Promise.all(
      userRewards.data.links.map((l) => centChainService().claimedRADRewards(l.centAccountID))
    )
    dispatch({ data, type: RECEIVE_CENT_CHAIN })
  }
}

export function loadCentChainConnected(
  centAccountID: string
): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch, getState) => {
    dispatch({ type: LOAD_CENT_CHAIN_CONNECTED, centAccountID })
    const data = await centChainService().claimedRADRewards(centAccountID)
    const state = await getState()
    dispatch({ data, type: RECEIVE_CENT_CHAIN_CONNECTED })
    if (state.userRewards.collectionData?.collectable === null) {
      dispatch(loadClaimsTree())
    }
  }
}

export function loadClaimsTree(): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_GCP })
    const r = await fetch(config.rewardsTreeUrl)
    if (!r.ok) {
      throw new Error(`could not load rewards tree from ${config.rewardsTreeUrl}`)
    }
    const data = await r.json()
    dispatch({ data, type: RECEIVE_GCP })
  }
}
