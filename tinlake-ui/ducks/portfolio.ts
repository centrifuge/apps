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
  balanceAmount: BN
  totalValue: BN
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
            return prev.add(tokenBalance.totalValue)
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

    const watchers = ipfsPools.active.flatMap((pool) => [
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

    const watcher = createWatcher(watchers, multicallConfig)

    /*
     * matches the token id's in tokenBalance with the token id's
     * from the multicall to find the correct value (price) and balance
     * any[] type instead of ICall[] type until https://github.com/makerdao/multicall.js/pull/29 is merged
     */
    const getUpdatedAmount = (updates: any[], balance: TokenBalance, updateType: 'price' | 'balance') => {
      const updatedAmount = updates.find((update) => {
        const [tokenId, type] = update.type.split('-')
        return tokenId.toLowerCase() === balance.token.id.toLowerCase() && type === updateType
      })

      if (updatedAmount?.value) {
        return updatedAmount?.value
      }

      return updateType === 'price' ? balance.totalValue : balance.balanceAmount
    }

    // any[] type instead of ICall[] type until https://github.com/makerdao/multicall.js/pull/29 is merged
    watcher.batch().subscribe((updates: any[]) => {
      /*
       * overwrites the values in tokenBalances that were retrieved from
       * the subgraph with the values from the multicall updates
       */

      const updatedTokenBalances = tokenBalances.map((balance: TokenBalance) => {
        const updatedBalance = getUpdatedAmount(updates, balance, 'balance')
        const updatedPrice = getUpdatedAmount(updates, balance, 'price')

        const updatedValue = updatedBalance.mul(updatedPrice).div(new BN(10).pow(new BN(27)))

        return {
          ...balance,
          value: updatedValue,
          balance: updatedBalance,
        }
      })

      dispatch({ data: updatedTokenBalances, type: RECEIVE_PORTFOLIO })
    })

    watcher.start()
  }
}
