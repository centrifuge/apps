import { PoolData } from '../../../utils/usePool'
import { assetList } from './AssetList'
import { dailyInvestorBalances } from './DailyInvestorBalances'
import { dailyTokenPrices } from './DailyTokenPrices'
import { rawPoolData } from './PoolData'

export type PoolQuery = ({ poolId, poolData }: { poolId: string; poolData: PoolData }) => Promise<boolean>

const queries: { [name: string]: PoolQuery } = {
  'Daily investor balances': dailyInvestorBalances,
  'Daily token prices': dailyTokenPrices,
  'List of assets': assetList,
  'Raw pool data': rawPoolData,
}

export default queries

export function csvName(name: string) {
  return `${name.replaceAll(' ', '-').toLowerCase()}_${Math.round(Date.now() / 1000)}.csv`
}
