import { CurrencyBalance, Rate } from '@centrifuge/centrifuge-js'
import { ActiveLoan } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useLoans } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import { Spinner } from './Spinner'

const RiskGroupSharesPieChart = React.lazy(() => import('./Charts/RiskGroupSharesPieChart'))

export type RiskGroupRow = {
  color?: string
  labelColor?: string
  name: string | React.ReactElement
  amount: string | React.ReactElement
  share: string | React.ReactElement
  interestRatePerSec: string | React.ReactElement
  riskAdjustment: string | React.ReactElement
  currency: string
}

const columns: Column[] = [
  {
    align: 'left',
    header: <SortableTableHeader label="Risk group" />,
    cell: (riskGroup: RiskGroupRow) => (
      <Shelf gap="1">
        {riskGroup?.color && <Box width="10px" height="10px" backgroundColor={riskGroup.color} />}
        <Text variant="body2" fontWeight={600}>
          {riskGroup.name}
        </Text>
      </Shelf>
    ),
    flex: '1',
    sortKey: 'name',
  },
  {
    header: <SortableTableHeader label="Amount" />,
    cell: ({ amount, currency }: RiskGroupRow) =>
      typeof amount === 'string' ? <Text variant="body2">{formatBalance(Dec(amount), currency)}</Text> : amount,
    flex: '1',
    sortKey: 'amount',
  },
  {
    header: <SortableTableHeader label="Share" />,
    cell: ({ share }: RiskGroupRow) => <Text variant="body2">{share}%</Text>,
    flex: '1',
    sortKey: 'share',
  },
  {
    header: <SortableTableHeader label="Financing fee" />,
    cell: ({ interestRatePerSec }: RiskGroupRow) => (
      <Text variant="body2">
        {interestRatePerSec && typeof interestRatePerSec === 'string'
          ? `${interestRatePerSec}%`
          : React.isValidElement(interestRatePerSec)
          ? interestRatePerSec
          : ''}
      </Text>
    ),
    flex: '1',
    sortKey: 'interestRatePerSec',
  },
  {
    header: <SortableTableHeader label="Risk adjustment" />,
    cell: ({ riskAdjustment }: RiskGroupRow) => (
      <Text variant="body2">
        {riskAdjustment && typeof riskAdjustment === 'string'
          ? `${riskAdjustment}%`
          : React.isValidElement(riskAdjustment)
          ? riskAdjustment
          : ''}
      </Text>
    ),
    flex: '1',
    sortKey: 'riskAdjustment',
  },
]

const RiskGroupList: React.FC = () => {
  const { pid } = useParams<{ pid: string }>()
  const loans = useLoans(pid)
  const pool = usePool(pid)
  const theme = useTheme()
  const { data: metadata } = usePoolMetadata(pool)

  const activeLoans = loans?.filter((loan) => loan.status === 'Active') as ActiveLoan[]

  const totalAmountsSum = React.useMemo(
    () =>
      new CurrencyBalance(
        activeLoans?.reduce((prev, curr) => prev.add(curr?.outstandingDebt || new BN(0)), new BN(0)) || new BN(0),
        pool?.currencyDecimals ?? 18
      ),
    [activeLoans, pool]
  )

  const riskGroups = React.useMemo(() => {
    return (
      metadata?.riskGroups!.map((group) => {
        const loansByRiskGroup = activeLoans?.filter((loan) => {
          return (
            // find loans that have matching number to risk group to determine which riskGroup they belong to (we don't store associations on chain)
            (loan.loanInfo.type !== 'CreditLine' &&
              loan.outstandingDebt.toDecimal().greaterThan(0) &&
              loan.loanInfo.lossGivenDefault.toString() === group?.lossGivenDefault &&
              loan.loanInfo.probabilityOfDefault.toString() === group?.probabilityOfDefault &&
              loan.loanInfo.advanceRate.toString() === group?.advanceRate &&
              loan.interestRatePerSec.toString() === group?.interestRatePerSec) ||
            (loan.loanInfo.type === 'CreditLine' &&
              loan.loanInfo.advanceRate.toString() === group?.advanceRate &&
              loan.interestRatePerSec.toString() === group?.interestRatePerSec)
          )
        }) as ActiveLoan[]

        const lgd = new Rate(group?.lossGivenDefault).toPercent()
        const pod = new Rate(group.probabilityOfDefault).toPercent()
        const riskAdjustment = lgd.mul(pod).div(100).toDecimalPlaces(2).toString()
        const interestRatePerSec = new Rate(group.interestRatePerSec).toAprPercent().toDecimalPlaces(2).toString()

        const amount = new CurrencyBalance(
          loansByRiskGroup?.reduce((prev, curr) => prev?.add(curr?.outstandingDebt || new BN(0)), new BN(0)),
          pool?.currencyDecimals ?? 18
        )
        if (!amount || !totalAmountsSum) {
          return {
            currency: pool?.currency || '',
            name: group.name,
            amount: '',
            share: '',
            interestRatePerSec,
            riskAdjustment,
          } as RiskGroupRow
        }

        return {
          currency: pool?.currency || '',
          name: group.name,
          amount: amount.toDecimal().toString(),
          share: Dec(amount?.toDecimal()).div(totalAmountsSum.toDecimal()).mul(100).toDecimalPlaces(0).toString(),
          interestRatePerSec,
          riskAdjustment,
        } as RiskGroupRow
      }) || []
    )
  }, [metadata, activeLoans, pool, totalAmountsSum])

  const totalSharesSum = riskGroups
    .reduce((prev, curr) => (typeof curr.share === 'string' ? prev.add(curr.share || 0) : prev), Dec(0))
    .toString()
  const summaryRow: RiskGroupRow = React.useMemo(() => {
    // average weighted by outstanding amounts
    const avgInterestRatePerSec = riskGroups
      .reduce(
        (prev, curr) =>
          typeof curr.interestRatePerSec === 'string' && typeof curr.amount === 'string'
            ? prev.add(Dec(curr.interestRatePerSec).mul(curr.amount))
            : prev,
        Dec(0)
      )
      .dividedBy(totalAmountsSum.toDecimal())
      .toDecimalPlaces(2)

    // average weighted by outstanding amounts
    const avgRiskAdjustment = riskGroups
      .reduce(
        (prev, curr) =>
          typeof curr.riskAdjustment === 'string' && typeof curr.amount === 'string'
            ? prev.add(Dec(curr.riskAdjustment).mul(curr.amount))
            : prev,
        Dec(0)
      )
      .dividedBy(totalAmountsSum.toDecimal())
      .toDecimalPlaces(2)

    return {
      share: (
        <Text variant="body2" fontWeight={600}>
          {totalSharesSum}
        </Text>
      ),
      amount: (
        <Text variant="body2" fontWeight={600}>
          {formatBalance(totalAmountsSum || 0, pool?.currency)}
        </Text>
      ),
      name: (
        <Text variant="body2" fontWeight={600}>
          Total
        </Text>
      ),
      interestRatePerSec: <Text variant="body2" fontWeight={600}>{`Avg. ${avgInterestRatePerSec.toString()}%`}</Text>,
      riskAdjustment: <Text variant="body2" fontWeight={600}>{`Avg. ${avgRiskAdjustment.toString()}%`}</Text>,
      color: '',
      labelColor: '',
      currency: pool?.currency || '',
    }
  }, [riskGroups, pool?.currency, totalSharesSum, totalAmountsSum])

  // biggest share of pie gets darkest color
  const tableDataWithColor = riskGroups.map((item, index) => {
    if (metadata?.riskGroups!.length) {
      const name = item.name ? `${index + 1} – ${item.name}` : `${index + 1}`
      if (Dec(totalSharesSum).lessThanOrEqualTo(0)) {
        return { ...item, name }
      }
      const nextShade = ((index + 2) % 8) * 100
      return {
        ...item,
        name,
        color: theme.colors.accentScale[nextShade],
        labelColor: nextShade >= 500 ? 'white' : 'black',
      }
    }
    return item
  })

  const sharesForPie = tableDataWithColor
    .sort((a, b) => Number(a.amount) - Number(b.amount))
    .map(({ name, color, labelColor, share }) => {
      return { value: Number(share), name: name as string, color, labelColor }
    })

  return (
    <>
      {sharesForPie.length > 0 && totalSharesSum !== '0' && (
        <Shelf justifyContent="center">
          <React.Suspense fallback={<Spinner />}>
            <RiskGroupSharesPieChart data={sharesForPie} />
          </React.Suspense>
        </Shelf>
      )}
      {tableDataWithColor.length > 0 ? (
        <Box mt={sharesForPie.length > 0 && totalSharesSum !== '0' ? '0' : '3'}>
          <DataTable
            defaultSortKey="name"
            defaultSortOrder="asc"
            data={tableDataWithColor}
            columns={columns}
            summary={summaryRow}
          />
        </Box>
      ) : (
        <Text variant="label1">No data</Text>
      )}
    </>
  )
}

export default RiskGroupList
