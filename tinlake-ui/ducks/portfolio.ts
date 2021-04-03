import { createWatcher } from '@makerdao/multicall'
import BN from 'bn.js'
import { BigNumber } from 'ethers'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config, { IpfsPools } from '../config'
import Apollo from '../services/apollo'

const multicallConfig = {
  rpcUrl: config.rpcUrl,
  multicallAddress: config.multicallContractAddress,
  interval: 60000,
}

// Actions
const LOAD_PORTFOLIO = 'tinlake-ui/pools/LOAD_PORTFOLIO'
const RECEIVE_PORTFOLIO = 'tinlake-ui/pools/RECEIVE_PORTFOLIO'

export interface TokenBalance {
  token: {
    id: string
    symbol: string
  }
  balance: BN
  value: BN
  supplyAmount: BN
  pendingSupplyCurrency: BN
}

export interface PortfolioState {
  state: null | 'loading' | 'found'
  data: TokenBalance[]
  totalValue: null | BN
}

const initialState: PortfolioState = {
  state: null,
  data: [],
  totalValue: null,
}

export default function reducer(
  state: PortfolioState = initialState,
  action: AnyAction = { type: '' }
): PortfolioState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.pools || {}) }
    case LOAD_PORTFOLIO:
      return { ...state, state: 'loading' }
    case RECEIVE_PORTFOLIO:
      return {
        ...state,
        state: 'found',
        data: action.data,
        totalValue:
          action.data?.reduce((prev: BN, tokenBalance: TokenBalance) => {
            return prev.add(tokenBalance.value)
          }, new BN(0)) || new BN(0),
      }
    default:
      return state
  }
}

export function loadPortfolio(
  address: string,
  ipfsPools: IpfsPools
): ThunkAction<Promise<void>, PortfolioState, undefined, Action> {
  return async (dispatch) => {
    const tokenBalances = await Apollo.getPortfolio(address)

    const toBN = (val: BigNumber) => new BN(val.toString())

    const watches = ipfsPools.active.flatMap((pool) => [
      {
        target: pool.addresses.ASSESSOR,
        call: ['calcJuniorTokenPrice()(uint256)'],
        returns: [[`${pool.addresses.JUNIOR_TOKEN}-price`, toBN]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['calcSeniorTokenPrice()(uint256)'],
        returns: [[`${pool.addresses.SENIOR_TOKEN}-price`, toBN]],
      },
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['balanceOf(address)(uint256)', address],
        returns: [[`${pool.addresses.JUNIOR_TOKEN}-balance`, toBN]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['balanceOf(address)(uint256)', address],
        returns: [[`${pool.addresses.SENIOR_TOKEN}-balance`, toBN]],
      },
    ])

    const watcher = createWatcher(watches, multicallConfig)

    /*
     * matches the token id's in tokenBalance with the token id's
     * from the multicall to find the correct value (price) and balance
     * any[] type instead of ICall[] type until https://github.com/makerdao/multicall.js/pull/29 is merged
     */
    const findAmount = (updates: any[], balance: TokenBalance, infoType: 'price' | 'balance') => {
      const updateBalance = updates.find((update) => {
        const [tokenId, type] = update.type.split('-')
        return tokenId.toLowerCase() === balance.token.id.toLowerCase() && type === infoType
      })

      if (updateBalance?.value) {
        return updateBalance.value
      }

      return infoType === 'price' ? balance.value : balance.balance
    }

    // any[] type instead of ICall[] type until https://github.com/makerdao/multicall.js/pull/29 is merged
    watcher.batch().subscribe((updates: any[]) => {
      /*
       * overwrites the values in tokenBalances that were retrieved from
       * the subgraph with the values from the multicall updates
       */
      const updatedTokenBalances = tokenBalances.map((balance: TokenBalance) => ({
        ...balance,
        value: findAmount(updates, balance, 'price'),
        balance: findAmount(updates, balance, 'balance'),
      }))

      dispatch({ data: updatedTokenBalances, type: RECEIVE_PORTFOLIO })
    })

    watcher.start()
  }
}
