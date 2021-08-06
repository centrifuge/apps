import { createWatcher } from '@makerdao/multicall'
import BN from 'bn.js'
import { BigNumber } from 'ethers'
import set from 'lodash/set'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config, { IpfsPools } from '../config'

const multicallConfig = {
  rpcUrl: config.rpcUrl,
  multicallAddress: config.multicallContractAddress,
  interval: 60000,
}

// Actions
const LOAD_PORTFOLIO = 'tinlake-ui/pools/LOAD_PORTFOLIO'
const RECEIVE_PORTFOLIO = 'tinlake-ui/pools/RECEIVE_PORTFOLIO'

export interface TokenBalance {
  id: string
  symbol: string
  price: BN
  value: BN
  balance: BN
}

export interface PortfolioState {
  state: null | 'loading' | 'found'
  data: TokenBalance[]
  lastMulticallResult: null | any
  address: null | string
  totalValue: null | BN
}

const initialState: PortfolioState = {
  state: null,
  data: [],
  lastMulticallResult: {},
  address: null,
  totalValue: null,
}

export default function reducer(
  state: PortfolioState = initialState,
  action: AnyAction = { type: '' }
): PortfolioState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.portfolio || {}) }
    case LOAD_PORTFOLIO:
      return { ...state, state: 'loading', address: action.address }
    case RECEIVE_PORTFOLIO:
      if (action.address !== state.address) return state
      return {
        ...state,
        state: 'found',
        data: action.data,
        lastMulticallResult: action.multicallResult,
        totalValue:
          action.data?.reduce((prev: BN, tokenBalance: TokenBalance) => {
            return prev.add(tokenBalance.value)
          }, new BN(0)) || new BN(0),
      }
    default:
      return state
  }
}

const watcher: any = createWatcher([], multicallConfig)
watcher.onError((err: Error) => {
  console.error(`Portfolio multicall error: ${err}`)
})

export function loadPortfolio(
  address: string,
  ipfsPools: IpfsPools
): ThunkAction<Promise<void>, PortfolioState, undefined, Action> {
  return async (dispatch, getState) => {
    dispatch({ address, type: LOAD_PORTFOLIO })

    const toBN = (val: BigNumber) => new BN(val.toString())

    const watchers = ipfsPools.active.flatMap((pool) => [
      {
        target: pool.addresses.ASSESSOR,
        call: ['calcJuniorTokenPrice()(uint256)'],
        returns: [[`${pool.addresses.JUNIOR_TOKEN}.price`, toBN]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['calcSeniorTokenPrice()(uint256)'],
        returns: [[`${pool.addresses.SENIOR_TOKEN}.price`, toBN]],
      },
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['balanceOf(address)(uint256)', address],
        returns: [[`${pool.addresses.JUNIOR_TOKEN}.balance`, toBN]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['balanceOf(address)(uint256)', address],
        returns: [[`${pool.addresses.SENIOR_TOKEN}.balance`, toBN]],
      },
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['symbol()(string)'],
        returns: [[`${pool.addresses.JUNIOR_TOKEN}.symbol`]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['symbol()(string)'],
        returns: [[`${pool.addresses.SENIOR_TOKEN}.symbol`]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['calcDisburse(address))(uint256,uint256,uint256,uint256)', address],
        returns: [
          [`${pool.addresses.JUNIOR_TOKEN}.payoutCurrencyAmount`, toBN],
          [`${pool.addresses.JUNIOR_TOKEN}.payoutTokenAmount`, toBN],
          [`${pool.addresses.JUNIOR_TOKEN}.remainingSupplyCurrency`, toBN],
          [`${pool.addresses.JUNIOR_TOKEN}.remainingRedeemToken`, toBN],
        ],
      },
      {
        target: pool.addresses.SENIOR_TRANCHE,
        call: ['calcDisburse(address))(uint256,uint256,uint256,uint256)', address],
        returns: [
          [`${pool.addresses.SENIOR_TOKEN}.payoutCurrencyAmount`, toBN],
          [`${pool.addresses.SENIOR_TOKEN}.payoutTokenAmount`, toBN],
          [`${pool.addresses.SENIOR_TOKEN}.remainingSupplyCurrency`, toBN],
          [`${pool.addresses.SENIOR_TOKEN}.remainingRedeemToken`, toBN],
        ],
      },
    ])

    watcher.recreate(watchers, multicallConfig)

    // any[] type instead of ICall[] type until https://github.com/makerdao/multicall.js/pull/29 is merged
    watcher.batch().subscribe((updates: any[]) => {
      const newPartialResult = {}
      updates.forEach((update) => {
        set(newPartialResult, update.type, update.value)
      })

      const prevState = (getState() as any).portfolio as PortfolioState
      const prevResult = prevState.address === address ? prevState.lastMulticallResult : {}
      const newResult = mergeResult(prevResult, newPartialResult)

      const updatedTokenBalances = Object.entries(newResult).map(([tokenId, tokenResult]: [string, any]) => {
        const newBalance = new BN(tokenResult.balance).add(new BN(tokenResult.payoutTokenAmount))
        const newPrice = new BN(tokenResult.price)
        const newValue = newBalance.mul(newPrice).div(new BN(10).pow(new BN(27)))

        return { id: tokenId, symbol: tokenResult.symbol, price: newPrice, value: newValue, balance: newBalance }
      })

      dispatch({ address, data: updatedTokenBalances, multicallResult: newResult, type: RECEIVE_PORTFOLIO })
    })

    watcher.start()
  }
}

function mergeResult<T extends object>(old: T, partialNew: Partial<T>) {
  const newObj = { ...partialNew, ...old }
  for (const key in newObj) {
    newObj[key] = {
      ...old[key],
      ...partialNew[key],
    }
  }

  return newObj
}
