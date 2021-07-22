import { assetList } from './assetList'
import { dailyTokenPrices } from './dailyTokenPrices'
import { dailyTVL } from './dailyTVL'
import { fortunaFiDailyInvestorBalances } from './fortunaFiDailyInvestorBalances'
import { poolList } from './poolList'

export type Query = () => Promise<void>

const queries: { [name: string]: Query } = {
  'Debt per pool (current)': poolList,
  'Asset details per pool (current)': assetList,
  'TVL (daily)': dailyTVL,
  'TIN/DROP token prices (daily)': dailyTokenPrices,
  'FortunaFi Daily Investor Balances': fortunaFiDailyInvestorBalances,
}

export default queries

export function csvName(name: string) {
  return `${name.replace(' ', '-').toLowerCase()}_${Math.round(Date.now() / 1000)}.csv`
}
