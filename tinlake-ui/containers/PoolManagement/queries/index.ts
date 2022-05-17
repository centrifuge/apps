import { PoolData } from '../../../utils/usePool'
import { assetList } from './AssetList'
import { dailyInvestorBalances } from './DailyInvestorBalances'
import { dailyTokenPrices } from './DailyTokenPrices'
import { investorTransactions } from './InvestorTransactions'
import { rawPoolData } from './PoolData'
import { taxReport2020, taxReport2021 } from './TaxReports'

export type PoolQuery = ({
  poolId,
  poolData,
}: {
  poolId: string
  poolData: PoolData
  csvData?: string[][]
}) => Promise<boolean>

const queries: { [name: string]: PoolQuery } = {
  'Daily investor balances': dailyInvestorBalances,
  'Daily token prices': dailyTokenPrices,
  'List of assets': assetList,
  'Raw pool data': rawPoolData,
  'Investor transactions': investorTransactions,
  'Tax report 2020': taxReport2020,
  'Tax report 2021': taxReport2021,
}

export default queries

export function csvName(name: string) {
  return `${name.replaceAll(' ', '-').toLowerCase()}_${Math.round(Date.now() / 1000)}.csv`
}
