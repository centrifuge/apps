import { Pool } from '@centrifuge/centrifuge-js'
import Centrifuge from '@centrifuge/sdk'
import {
  AssetListReport,
  AssetTransactionReport,
  BalanceSheetReport,
  CashflowReport,
  DataReport,
  FeeTransactionReport,
  InvestorListReport,
  InvestorTransactionsReport,
  OrdersListReport,
  ProfitAndLossReport,
  Report,
  TokenPriceReport,
} from '@centrifuge/sdk/dist/types/reports'
import { useMemo } from 'react'
import { UseQueryResult, useQuery } from 'react-query'
import { GroupBy } from './ReportContext'
import { getAdjustedDates } from './utils'

type ReportResult<T extends ReportsType> = T extends 'cashflow'
  ? CashflowReport[]
  : T extends 'balanceSheet'
  ? BalanceSheetReport[]
  : T extends 'profitAndLoss'
  ? ProfitAndLossReport[]
  : T extends 'investorTransactions'
  ? InvestorTransactionsReport[]
  : T extends 'assetTransactions'
  ? AssetTransactionReport[]
  : T extends 'feeTransactions'
  ? FeeTransactionReport[]
  : T extends 'tokenPrice'
  ? TokenPriceReport[]
  : T extends 'assetList'
  ? AssetListReport[]
  : T extends 'investorList'
  ? InvestorListReport[]
  : T extends 'ordersList'
  ? OrdersListReport[]
  : never

type ReportsType = Report | DataReport

const centrifuge = new Centrifuge({
  environment: 'mainnet',
  indexerUrl: 'https://api-main.cfg.embrio.tech/',
})

export function useReport<T extends ReportsType>(
  reportType: T,
  pool: Pool,
  startDate: Date | undefined,
  endDate: Date | undefined,
  groupBy?: GroupBy,
  filters?: any
): UseQueryResult<ReportResult<T>> {
  const [adjustedStartDate, adjustedEndDate] = useMemo(
    () =>
      getAdjustedDates(
        groupBy || undefined,
        startDate ?? undefined,
        endDate ?? undefined,
        pool.createdAt ? new Date(pool.createdAt) : undefined
      ),
    [groupBy, startDate, endDate, pool.createdAt]
  )

  return useQuery<ReportResult<T>>({
    queryKey: [reportType, pool.id, startDate, endDate, groupBy, filters],
    queryFn: async () => {
      const sdkPool = await centrifuge.pool(pool.id, pool.metadata)
      const group = groupBy === 'day' || groupBy === 'daily' ? 'day' : groupBy

      const rawReport = await sdkPool.reports[reportType]({
        from: adjustedStartDate?.toISOString(),
        to: adjustedEndDate?.toISOString(),
        groupBy: group,
        ...filters,
      })

      if (groupBy === 'day') {
        return [rawReport?.[0]] as ReportResult<T>
      }

      return rawReport as ReportResult<T>
    },
    enabled: !!pool.id,
  })
}
