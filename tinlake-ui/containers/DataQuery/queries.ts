import { assetList } from './assetList'
import { dailyTokenPrices } from './dailyTokenPrices'
import { dailyTVL } from './dailyTVL'
import { fortunaFiDailyInvestorBalances } from './fortunaFiDailyInvestorBalances'
import { poolList } from './poolList'

export type Query = () => Promise<void>

const queries: { [name: string]: Query } = {
  'Pool list': poolList,
  'Asset list': assetList,
  'Daily TVL': dailyTVL,
  'Daily token prices': dailyTokenPrices,
  'FortunaFi Daily Investor Balances': fortunaFiDailyInvestorBalances,
}

export default queries

export function csvName(name: string) {
  return `${name.replace(' ', '-').toLowerCase()}_${Math.round(Date.now() / 1000)}.csv`
}
