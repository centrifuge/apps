import { assetList } from './AssetList'
import { dailyInvestorBalances } from './DailyInvestorBalances'
import { dailyTokenPrices } from './DailyTokenPrices'

export type PoolQuery = (poolId: string) => Promise<boolean>

const queries: { [name: string]: PoolQuery } = {
  'Daily investor balances': dailyInvestorBalances,
  'Daily token prices': dailyTokenPrices,
  'List of assets': assetList,
}

export default queries

export function csvName(name: string) {
  return `${name.replace(/#\w/g, '').toLowerCase()}_${Math.round(Date.now() / 1000)}.csv`
}
