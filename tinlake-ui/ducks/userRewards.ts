import { ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config from '../config'
import Apollo from '../services/apollo'
import { centChainService } from '../services/centChain'

// Actions
const LOAD_SUBGRAPH = 'tinlake-ui/user-rewards/LOAD_SUBGRAPH'
const RECEIVE_SUBGRAPH = 'tinlake-ui/user-rewards/RECEIVE_SUBGRAPH'
const LOAD_ETH_LINK = 'tinlake-ui/user-rewards/LOAD_ETH_LINK'
const RECEIVE_ETH_LINK = 'tinlake-ui/user-rewards/RECEIVE_ETH_LINK'
const LOAD_CENT_CHAIN = 'tinlake-ui/user-rewards/LOAD_CENT_CHAIN'
const RECEIVE_CENT_CHAIN = 'tinlake-ui/user-rewards/RECEIVE_CENT_CHAIN'
const LOAD_CLAIMS = 'tinlake-ui/user-rewards/LOAD_CLAIMS'
const RECEIVE_CLAIMS = 'tinlake-ui/user-rewards/RECEIVE_CLAIMS'

// just used for readability
type AccountIDString = string

export interface UserRewardsState {
  subgraphState: null | 'loading' | 'found'
  centChainState: null | 'loading' | 'found'
  data: null | UserRewardsData
  claimsState: null | 'loading' | 'found'
  claims: null | RewardClaim[]
  ethLinkState: null | 'loading' | 'found'
  ethLink: null | string
}

/**
 * Process to earn and claim rewards:
 * 1. User earns rewards on Ethereum for any investments on that Ethereum account `totalEarnedRewards`
 * 2. After holding a non zero investements for 60 days, those rewards become `claimable`
 * 3. To claim rewards, user needs to link a Cent Chain account to the Ethereum account. If there is none, any rewards
 *    are in `unlinkedRewards`. If there is a link, rewards will be fully assigned to the (last) linked Cent Chain
 *    account.
 * 4. For those linked rewards to be claimable on Cent Chain, the amounts and balances (we call them together `claims`)
 *    are put once per day into a merkle tree, which's root will be stored on Cent Chain, and which's leaves will be
 *    uploaded to GCP into a storage bucket. Once the rewards are in the bucket and the root hash are stored on Cent
 *    Chain, they become claimable.
 * 5. User can now claim the rewards on Cent Chain.
 * 6. Claimed rewards can be queried from cent chain.
 */
export interface UserRewardsData {
  /**
   * From subgraph. If null, the user has not had any investments yet. If the user invested any amount, this number will
   * be a timestamp (in seconds).
   */
  nonZeroInvestmentSince: BN | null
  /**
   * From subgraph. Determines whether investment was long enough on Ethereum yet for rewards to be claimable.
   */
  claimable: boolean
  /**
   * From subgraph. Those are rewards that have not been linked to a Cent Chain account on Ethereum. They can be linked
   * at any time. If claimable is true, they will be immediately assigned to a linked Cent Chain account. If claimable
   * is false, they will remain unlinked until they become claimable.
   */
  unlinkedRewards: BN
  /**
   * From subgraph. Rewards earned on Ethereum across all links for this Ethereum account so far, might be claimable,
   * might have been claimed. Should equal the sum of links.earned and unlinkedRewards
   */
  totalEarnedRewards: BN
  /**
   * From multiple data sources. Contains information about a specific Centrifuge Chain account linked to the ethereum
   * account, including claimable and claimed amounts.
   */
  links: UserRewardsLink[]
}

export interface UserRewardsLink {
  /**
   * From subgraph. Cent Chain account that has been linked to this Ethereum account and can receive rewards
   */
  centAccountID: AccountIDString
  /**
   * From subgraph. Amount of rewards that have been claimed on Ethereum and have been assigned to this link/Cent
   * Chain account. Any new rewards earned by any user will be added to the latest link once per day.
   */
  earned: BN
  /**
   * From stored list of reward claims in rad-rewards-trees GCP bucket. Once per day, all Cent Chain account IDs and
   * their respective earned rewards will be put into a merkle tree, the root is stored on Centrifuge Chain and the tree
   * leaves are uploaded to GCP. `null` if data has not been received yet. NOTE: claimable can be higher than earned
   * here, since the same Centrifuge Chain account can be used by multiple Ethereum accounts.
   */
  claimable: BN | null
  /**
   * From Centrifuge Chain. Amount that has already been claimed by a user on Centrifuge Chain. `null` if data has not
   * been received yet. NOTE: claimed can be higher than earned here, since the same Centrifuge Chain account can be
   * used by multiple Ethereum accounts.
   */
  claimed: BN | null
}

export interface RewardClaim {
  /**
   * From GCP, hex encoded centrifuge chain account ID
   */
  accountID: string
  /**
   * From GCP, big integer RAD in base unit
   */
  balance: string
}

const initialState: UserRewardsState = {
  subgraphState: null,
  centChainState: null,
  data: null,
  claimsState: null,
  claims: null,
  ethLinkState: null,
  ethLink: null,
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
          ? { ...state.data, links: state.data.links.map((l, i) => ({ ...l, claimed: new BN(action.data[i]) })) }
          : null,
      }
    case LOAD_CLAIMS:
      return { ...state, claimsState: 'loading' }
    case RECEIVE_CLAIMS: {
      const claims = action.data as RewardClaim[]
      return {
        ...state,
        claimsState: 'found',
        claims,
        data: state.data
          ? {
              ...state.data,
              links: state.data.links.map((l) => ({
                ...l,
                claimable: new BN(claims.find((ad) => ad.accountID === l.centAccountID)?.balance || 0),
              })),
            }
          : null,
      }
    }
    case LOAD_ETH_LINK:
      return { ...state, ethLink: null, ethLinkState: 'loading' }
    case RECEIVE_ETH_LINK:
      return { ...state, ethLink: action.link, ethLinkState: 'found' }
    default:
      return state
  }
}

export function load(
  ethAddr: string
): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch) => {
    await dispatch(loadSubgraph(ethAddr)) // block, need data for next load
    dispatch(maybeLoadAndApplyClaims())
  }
}

export function loadSubgraph(
  ethAddr: string
): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_SUBGRAPH, ethAddr })
    const data = await Apollo.getUserRewards(ethAddr)
    dispatch({ data, type: RECEIVE_SUBGRAPH })
    await dispatch(loadCentChain())
  }
}

export function loadEthLink(
  ethAddr: string,
  tinlake: ITinlake
): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_ETH_LINK, ethAddr })
    let link: null | string = await tinlake.getClaimRADAccountID(ethAddr)
    if (link === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      link = null
    }
    dispatch({ type: RECEIVE_ETH_LINK, link })
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

export function loadClaims(): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_CLAIMS })
    const r = await fetch(config.rewardsTreeUrl)
    if (!r.ok) {
      throw new Error(`could not load rewards claims from ${config.rewardsTreeUrl}`)
    }
    const data = await r.json()
    dispatch({ data, type: RECEIVE_CLAIMS })
  }
}

// loads claims if not yet loaded, and in either case receives them so they are applied to the state
export function maybeLoadAndApplyClaims(): ThunkAction<
  Promise<void>,
  { userRewards: UserRewardsState },
  undefined,
  Action
> {
  return async (dispatch, getState) => {
    const { userRewards } = await getState()
    if (userRewards.claimsState === 'loading') {
      return
    } else if (userRewards.claimsState === 'found') {
      dispatch({ data: userRewards.claims, type: RECEIVE_CLAIMS })
    } else {
      dispatch(loadClaims())
    }
  }
}
