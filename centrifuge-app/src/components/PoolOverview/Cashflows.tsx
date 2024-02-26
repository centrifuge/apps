import { CurrencyBalance, Loan } from '@centrifuge/centrifuge-js'
import { AnchorButton, Card, IconDownload, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useLoans } from '../../utils/useLoans'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { CashflowsChart } from '../Charts/CashflowsChart'

export const Cashflows = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const { poolStates } = useDailyPoolStates(poolId) || {}
  const pool = usePool(poolId)
  const loans = useLoans(poolId) as Loan[] | undefined | null

  const firstOriginationDate = loans?.reduce((acc, cur) => {
    if ('originationDate' in cur) {
      if (!acc) return cur.originationDate
      return acc < cur.originationDate ? acc : cur.originationDate
    }
    return acc
  }, '')

  const truncatedPoolStates = poolStates?.filter((poolState) => {
    if (firstOriginationDate) {
      return new Date(poolState.timestamp) >= new Date(firstOriginationDate)
    }
    return true
  })

  const csvData = truncatedPoolStates?.map((poolState) => {
    return {
      Date: `"${formatDate(poolState.timestamp, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}"`,
      Purchases: poolState.sumBorrowedAmountByPeriod
        ? `"${formatBalance(
            new CurrencyBalance(poolState.sumBorrowedAmountByPeriod, pool.currency.decimals).toDecimal().toNumber(),
            'USD',
            2,
            2
          )}"`
        : '-',
      'Principal repayments': poolState.sumRepaidAmountByPeriod
        ? `"${formatBalance(
            new CurrencyBalance(poolState.sumRepaidAmountByPeriod, pool.currency.decimals).toDecimal().toNumber(),
            'USD',
            2,
            2
          )}"`
        : '-',
      Interest: poolState.sumInterestRepaidAmountByPeriod
        ? `"${formatBalance(
            new CurrencyBalance(poolState.sumInterestRepaidAmountByPeriod, pool.currency.decimals)
              .toDecimal()
              .toNumber(),
            'USD',
            2,
            2
          )}"`
        : '-',
    }
  })

  const csvUrl = csvData?.length ? getCSVDownloadUrl(csvData) : ''

  return (
    <Card p={3}>
      <Stack gap={2}>
        <Shelf justifyContent="space-between">
          <Text fontSize="18px" fontWeight="500">
            Cashflows
          </Text>
          <AnchorButton
            href={csvUrl}
            download={`pool-cashflow-data-${poolId}.csv`}
            variant="secondary"
            icon={IconDownload}
            small
            target="_blank"
          >
            Download
          </AnchorButton>
        </Shelf>
        <CashflowsChart poolStates={truncatedPoolStates} pool={pool} />
      </Stack>
    </Card>
  )
}
