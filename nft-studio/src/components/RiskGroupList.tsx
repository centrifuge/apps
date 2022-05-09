import { Balance, Rate } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useLoans } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import { PieChart } from './PieChart'

export type AssetByRiskGroup = {
  color?: string
  labelColor?: string
  name: string
  amount: Balance
  share: string
  interestRatePerSec: string
  riskAdjustment: string
}

const initialRow: AssetByRiskGroup = {
  name: '',
  amount: new Balance(0),
  share: '0',
  interestRatePerSec: '0',
  riskAdjustment: '0',
}

const columns: Column[] = [
  {
    align: 'left',
    header: () => <SortableTableHeader label="Risk group" />,
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
    header: () => <SortableTableHeader label="Amount" />,
    cell: (props: AssetByRiskGroup) => <Amount {...props} />,
    flex: '1',
    sortKey: 'amount',
  },
  {
    header: () => <SortableTableHeader label="Share" />,
    cell: ({ share }: AssetByRiskGroup) => <Text variant="body2">{share}%</Text>,
    flex: '1',
    sortKey: 'share',
  },
  {
    header: () => <SortableTableHeader label="Financing fee" />,
    cell: ({ interestRatePerSec }: AssetByRiskGroup) => (
      <Text variant="body2">{interestRatePerSec ? `${interestRatePerSec}%` : ''}</Text>
    ),
    flex: '1',
    sortKey: 'interestRatePerSec',
  },
  {
    header: () => <SortableTableHeader label="Risk adjustment" />,
    cell: ({ riskAdjustment }: AssetByRiskGroup) => (
      <Text variant="body2">{riskAdjustment ? `${riskAdjustment}%` : ''}</Text>
    ),
    flex: '1',
    sortKey: 'riskAdjustment',
  },
]

const Amount: React.VFC<AssetByRiskGroup> = ({ amount }) => {
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid)

  return <Text variant="body2">{formatBalance(amount, pool?.currency)}</Text>
}

export const RiskGroupList: React.FC = () => {
  const { pid } = useParams<{ pid: string }>()
  const loans = useLoans(pid)
  const pool = usePool(pid)
  const theme = useTheme()
  const { data: metadata } = usePoolMetadata(pool)

  const riskGroups = React.useMemo(() => {
    if (!metadata?.riskGroups) return []
    return metadata?.riskGroups?.map((group) => {
      const loansByRiskGroup = loans?.filter((loan) => {
        return (
          loan.loanInfo.type === 'BulletLoan' &&
          // find loans that have matching number to risk group to determine which riskGroup they belong to (we don't store associations on chain)
          loan.loanInfo?.lossGivenDefault.toString() === group?.lossGivenDefault &&
          loan.loanInfo?.probabilityOfDefault.toString() === group?.probabilityOfDefault &&
          loan.loanInfo?.advanceRate.toString() === group?.advanceRate &&
          loan?.interestRatePerSec.toString() === group?.interestRatePerSec
        )
      })

      const lgd = new Rate(group?.lossGivenDefault).toPercent()
      const pod = new Rate(group.probabilityOfDefault).toPercent()
      const riskAdjustment = lgd.mul(pod).div(100).toDecimalPlaces(2).toString()
      const interestRatePerSec = new Rate(group.interestRatePerSec).toAprPercent().toDecimalPlaces(2).toString()

      // temp solution while assets are still manually priced (in the future there will be a select to choose a riskGroup)
      if (!loansByRiskGroup || loansByRiskGroup?.length === 0) {
        return {
          ...initialRow,
          name: group.name,
          riskAdjustment,
          interestRatePerSec,
        } as AssetByRiskGroup
      }
      return loansByRiskGroup.reduce<AssetByRiskGroup>((prev, curr) => {
        const amount = new Balance(prev?.amount.add(curr.outstandingDebt))
        const share =
          pool && pool?.nav.latest.toString() !== '0' ? amount.muln(100).div(pool.nav.latest).toString() : '0'

        return {
          name: group.name,
          amount,
          share,
          interestRatePerSec,
          riskAdjustment,
        } as AssetByRiskGroup
      }, initialRow)
    })
  }, [metadata, loans, pool])

  // temp solution while assets are still manually priced (in the future there will be a select to choose a riskGroup)
  // represents all assets that could not be sorted into a riskGroup
  const remainingAssets: AssetByRiskGroup[] = React.useMemo(() => {
    const amountsSum = riskGroups.reduce((curr, prev) => new Balance(curr.add(prev.amount)), new Balance('0'))
    const sharesSum = riskGroups.reduce((curr, prev) => curr + Number(prev.share) * 100, 0)

    return sharesSum !== 100 && sharesSum !== 0
      ? [
          {
            name: 'Other',
            amount: new Balance(pool?.nav.latest.sub(amountsSum) || 0),
            share: `${100 - sharesSum / 100}`,
            interestRatePerSec: '',
            riskAdjustment: '',
          },
        ]
      : []
  }, [pool, riskGroups])

  const summaryRow = React.useMemo(() => {
    const totalSharesSum = [...riskGroups, ...remainingAssets]
      .reduce((curr, prev) => curr.add(prev.share), Dec(0))
      .toString()

    const avgInterestRatePerSec = riskGroups
      .reduce<any>((curr, prev) => curr.add(prev.interestRatePerSec), Dec(0))
      .dividedBy(riskGroups.length)
      .toDecimalPlaces(2)

    const avgRiskAdjustment = riskGroups
      .reduce<any>((curr, prev) => curr.add(prev.riskAdjustment), Dec(0))
      .dividedBy(riskGroups.length)
      .toDecimalPlaces(2)

    return {
      share: totalSharesSum.toString(),
      amount: new Balance(pool?.nav.latest || '0'),
      name: 'Total',
      interestRatePerSec: `Avg ${avgInterestRatePerSec.toString()}`,
      riskAdjustment: `Avg. ${avgRiskAdjustment.toString()}`,
    }
  }, [riskGroups, remainingAssets, pool?.nav.latest])

  // biggest share of pie gets darkest color
  const tableDataWithColor = [...riskGroups, ...remainingAssets]
    .sort((a, b) => Number(a.amount) - Number(b.amount))
    .map((item, index) => {
      if (metadata?.riskGroups!.length) {
        const nextShade = ((index + 2) % 8) * 100
        return {
          ...item,
          color: theme.colors.accentScale[nextShade],
          labelColor: nextShade >= 500 ? 'white' : 'black',
        }
      }
      return item
    })

  const sharesForPie = tableDataWithColor.map(({ name, color, labelColor, share }) => {
    return { value: Number(share), name, color, labelColor }
  })

  return (
    <>
      {sharesForPie.length > 0 && summaryRow.share !== '0' && (
        <Shelf justifyContent="center">
          <PieChart data={sharesForPie} />
        </Shelf>
      )}
      {tableDataWithColor.length > 0 ? (
        <Box mt={sharesForPie.length > 0 && summaryRow.share !== '0' ? '0' : '3'}>
          <DataTable defaultSortKey="share" data={tableDataWithColor} columns={columns} summary={summaryRow} />
        </Box>
      ) : (
        <Text variant="label1">No data</Text>
      )}
    </>
  )
}
