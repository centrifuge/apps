import { Balance, Rate } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useLoans } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, OrderBy, SortableTableHeader } from './DataTable'
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
    header: (orderBy: OrderBy) => <SortableTableHeader label="Risk group" orderBy={orderBy} />,
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
    header: (orderBy: OrderBy) => <SortableTableHeader label="Amount" orderBy={orderBy} />,
    cell: ({ amount }: AssetByRiskGroup) => <Text variant="body2">{formatBalance(amount)}</Text>,
    flex: '1',
    sortKey: 'amount',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Share" orderBy={orderBy} />,
    cell: ({ share }: AssetByRiskGroup) => {
      // console.log('🚀 ~ share cell', share.toString())
      return <Text variant="body2">{share}%</Text>
    },
    flex: '1',
    sortKey: 'share',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Financing fee" orderBy={orderBy} />,
    cell: ({ interestRatePerSec }: AssetByRiskGroup) => {
      return <Text variant="body2">{interestRatePerSec ? `${interestRatePerSec}%` : ''}</Text>
    },
    flex: '1',
    sortKey: 'financingFee',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Risk adjustment" orderBy={orderBy} />,
    cell: ({ riskAdjustment }: AssetByRiskGroup) => (
      <Text variant="body2">{riskAdjustment ? `${riskAdjustment}%` : ''}</Text>
    ),
    flex: '1',
    sortKey: 'riskAdjustment',
  },
]

export const RiskGroupList: React.FC = () => {
  const { pid } = useParams<{ pid: string }>()
  const loans = useLoans(pid)
  const pool = usePool(pid)
  const theme = useTheme()
  const { data: metadata } = usePoolMetadata(pool)

  const riskGroups = React.useMemo(() => {
    if (!metadata?.riskGroups || !loans || !loans.length) return []
    return metadata?.riskGroups?.map((group) => {
      const filteredLoans = loans?.filter((loan) => {
        return (
          loan.loanInfo.type === 'BulletLoan' &&
          // find loans that have matching number to risk group to determine which riskGroup they belong to (we don't store associations on chain)
          (loan.loanInfo?.lossGivenDefault).toString() === Dec(group?.lossGivenDefault || 0).toString() &&
          loan.loanInfo?.probabilityOfDefault.toString() === Dec(group?.probabilityOfDefault || 0).toString() &&
          loan.loanInfo?.advanceRate.toString() === Dec(group?.advanceRate || 0).toString() &&
          loan?.interestRatePerSec.toString() === Dec(group?.interestRatePerSec || 0).toString()
        )
      })

      const lgd = new Rate(group?.lossGivenDefault).toPercent()
      const pod = new Rate(group.probabilityOfDefault).toPercent()
      const riskAdjustment = lgd.mul(pod).div(100).toDecimalPlaces(2).toString()
      const interestRatePerSec = new Rate(group.interestRatePerSec).toAprPercent().toDecimalPlaces(2).toString()

      // temp solution while assets are still manually priced (in the future there will be a select to choose a riskGroup)
      if (filteredLoans.length === 0) {
        return {
          ...initialRow,
          name: group.name,
          riskAdjustment,
          interestRatePerSec,
        } as AssetByRiskGroup
      }
      return filteredLoans.reduce<AssetByRiskGroup>((prev, curr) => {
        const amount = new Balance(prev?.amount.add(curr.outstandingDebt))
        const share = pool && pool?.nav.latest.toString() !== '0' ? amount.div(pool.nav.latest).toString() : '0'

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
            share: '0',
            interestRatePerSec: '',
            riskAdjustment: '',
          },
        ]
      : []
  }, [pool, riskGroups])

  const totalRow = React.useMemo(() => {
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
      {sharesForPie.length > 0 && (
        <Shelf justifyContent="center">
          <PieChart data={sharesForPie} />
        </Shelf>
      )}
      {tableDataWithColor.length > 0 ? (
        <DataTable data={[...tableDataWithColor] || []} columns={columns} summary={totalRow} />
      ) : (
        <Text variant="label1">No data</Text>
      )}
    </>
  )
}
