import { PoolData } from '../../../utils/usePool'
import { assetList } from './AssetList'
import { dailyInvestorBalances } from './DailyInvestorBalances'
import { dailyTokenPrices } from './DailyTokenPrices'
import { investorTransactions2020, investorTransactions2021 } from './InvestorTransactions'
import { rawPoolData } from './PoolData'

export type PoolQuery = ({ poolId, poolData }: { poolId: string; poolData: PoolData }) => Promise<boolean>

const queries: { [name: string]: PoolQuery } = {
  'Daily investor balances': dailyInvestorBalances,
  'Daily token prices': dailyTokenPrices,
  'List of assets': assetList,
  'Raw pool data': rawPoolData,
  'Tax report 2020': investorTransactions2020,
  'Tax report 2021': investorTransactions2021,
}

export default queries

export function csvName(name: string) {
  return `${name.replaceAll(' ', '-').toLowerCase()}_${Math.round(Date.now() / 1000)}.csv`
}
