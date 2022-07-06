import { Balance, Rate } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useLoans } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { RiskGroupSharesPieChart } from './Charts/RiskGroupSharesPieChart'
import { Column, DataTable, SortableTableHeader } from './DataTable'

export type AssetByRiskGroup = {
  color?: string
  labelColor?: string
  name: string | React.ReactElement
  amount: string | React.ReactElement
  share: string | React.ReactElement
  interestRatePerSec: string | React.ReactElement
  riskAdjustment: string | React.ReactElement
}

const columns: Column[] = [
  {
    align: 'left',
    header: <SortableTableHeader label="Risk group" />,
    cell: (riskGroup: AssetByRiskGroup) => (
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
    cell: ({ amount }: AssetByRiskGroup) => <Text variant="body2">{amount}</Text>,
    flex: '1',
    sortKey: 'amount',
  },
  {
    header: <SortableTableHeader label="Share" />,
    cell: ({ share }: AssetByRiskGroup) => <Text variant="body2">{share}%</Text>,
    flex: '1',
    sortKey: 'share',
  },
  {
    header: <SortableTableHeader label="Financing fee" />,
    cell: ({ interestRatePerSec }: AssetByRiskGroup) => (
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
    cell: ({ riskAdjustment }: AssetByRiskGroup) => (
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

  const totalAmountsSum = React.useMemo(
    () =>
      loans?.reduce<Balance>(
        (prev, curr) => new Balance(prev.add(curr?.outstandingDebt || new Balance(0))),
        new Balance(0)
      ) || new Balance(0),
    [loans]
  )

  const riskGroups = React.useMemo(() => {
    return (
      metadata?.riskGroups!.map((group) => {
        const loansByRiskGroup = loans?.filter((loan) => {
          return (
            // find loans that have matching number to risk group to determine which riskGroup they belong to (we don't store associations on chain)
            (loan?.loanInfo &&
              loan.status === 'Active' &&
              loan.outstandingDebt?.toDecimal().greaterThan(0) &&
              loan.loanInfo.type !== 'CreditLine' &&
              loan.loanInfo?.lossGivenDefault.toString() === group?.lossGivenDefault &&
              loan.loanInfo?.probabilityOfDefault.toString() === group?.probabilityOfDefault &&
              loan.loanInfo?.advanceRate.toString() === group?.advanceRate &&
              loan?.interestRatePerSec?.toString() === group?.interestRatePerSec) ||
            (loan?.loanInfo &&
              loan.loanInfo.type === 'CreditLine' &&
              loan.loanInfo?.advanceRate.toString() === group?.advanceRate &&
              loan?.interestRatePerSec?.toString() === group?.interestRatePerSec)
          )
        })

        const lgd = new Rate(group?.lossGivenDefault).toPercent()
        const pod = new Rate(group.probabilityOfDefault).toPercent()
        const riskAdjustment = lgd.mul(pod).div(100).toDecimalPlaces(2).toString()
        const interestRatePerSec = new Rate(group.interestRatePerSec).toAprPercent().toDecimalPlaces(2).toString()

        const amount = loansByRiskGroup?.reduce<Balance>(
          (prev, curr) => new Balance(prev?.add(curr?.outstandingDebt || new Balance(0))),
          new Balance('0')
        )
        if (!amount || !totalAmountsSum) {
          return {
            name: group.name,
            amount: '',
            share: '',
            interestRatePerSec,
            riskAdjustment,
          } as AssetByRiskGroup
        }

        return {
          name: group.name,
          amount: formatBalance(amount, pool?.currency),
          share: Dec(amount?.toDecimal()).div(totalAmountsSum.toDecimal()).mul(100).toDecimalPlaces(0).toString(),
          interestRatePerSec,
          riskAdjustment,
        } as AssetByRiskGroup
      }) || []
    )
  }, [metadata, loans, pool, totalAmountsSum])

  const totalSharesSum = riskGroups
    .reduce((prev, curr) => (typeof curr.share === 'string' ? prev.add(curr.share || 0) : prev), Dec(0))
    .toString()
  const summaryRow = React.useMemo(() => {
    const avgInterestRatePerSec = riskGroups
      .reduce(
        (prev, curr) => (typeof curr.interestRatePerSec === 'string' ? prev.add(Dec(curr.interestRatePerSec)) : prev),
        Dec(0)
      )
      .dividedBy(riskGroups.length)
      .toDecimalPlaces(2)

    const avgRiskAdjustment = riskGroups
      .reduce(
        (prev, curr) => (typeof curr.riskAdjustment === 'string' ? prev.add(Dec(curr.riskAdjustment)) : prev),
        Dec(0)
      )
      .dividedBy(riskGroups.length)
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
    }
  }, [riskGroups, pool?.currency, totalSharesSum, totalAmountsSum])

  // biggest share of pie gets darkest color
  const tableDataWithColor = riskGroups
    .sort((a, b) => Number(a.amount) - Number(b.amount))
    .map((item, index) => {
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

  const sharesForPie = tableDataWithColor.map(({ name, color, labelColor, share }) => {
    return { value: Number(share), name: name as string, color, labelColor }
  })

  return (
    <>
      {sharesForPie.length > 0 && totalSharesSum !== '0' && (
        <Shelf justifyContent="center">
          <RiskGroupSharesPieChart data={sharesForPie} />
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
