import { feeToApr, formatCurrencyAmount, fromRate } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { Dec } from '../utils/Decimal'
import { useLoans } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, OrderBy, SortableTableHeader } from './DataTable'
import { PieChart } from './PieChart'

export type AssetByRiskGroup = {
  color?: string
  labelColor?: string
  name: string
  amount: string
  share: string
  financingFee: string
  riskAdjustment: string
}

const initialRow: AssetByRiskGroup = {
  name: '',
  amount: '0',
  share: '0',
  financingFee: '0',
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
    cell: ({ amount }: AssetByRiskGroup) => <Text variant="body2">{formatCurrencyAmount(amount)}</Text>,
    flex: '1',
    sortKey: 'amount',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Share" orderBy={orderBy} />,
    cell: ({ share }: AssetByRiskGroup) => <Text variant="body2">{share}%</Text>,
    flex: '1',
    sortKey: 'share',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Financing fee" orderBy={orderBy} />,
    cell: ({ financingFee }: AssetByRiskGroup) => <Text variant="body2">{financingFee ? `${financingFee}%` : ''}</Text>,
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
    const mappedRiskGroups = metadata?.riskGroups?.map((group, index) => {
      const filteredLoans = loans?.filter((loan) => {
        return (
          loan.loanInfo.type === 'BulletLoan' &&
          // find loans that have matching number to risk group to determine which riskGroup they belong to (we don't store associations on chain)
          fromRate(loan.loanInfo?.lossGivenDefault) === Dec(group.lossGivenDefault).div(100).toString() &&
          fromRate(loan.loanInfo?.probabilityOfDefault) === Dec(group.probabilityOfDefault).div(100).toString() &&
          fromRate(loan.loanInfo?.lossGivenDefault) === Dec(group.lossGivenDefault).div(100).toString() &&
          fromRate(loan.loanInfo?.advanceRate) === Dec(group.advanceRate).div(100).toString() &&
          feeToApr(loan?.financingFee) === Dec(group.financingFee).toDecimalPlaces(2).toString()
        )
      })

      // temp solution while assets are still manually priced (in the future there will be a select to choose a riskGroup)
      if (filteredLoans.length === 0) {
        return {
          name: group.name,
          amount: '0',
          share: '0',
          financingFee: '0',
          riskAdjustment: '0',
        } as AssetByRiskGroup
      }
      return filteredLoans.reduce<AssetByRiskGroup>((prev, curr) => {
        const amount = new BN(prev?.amount || '0').add(new BN(curr.outstandingDebt))
        const share = amount
          ?.muln(100)
          .div(new BN(pool?.nav.latest || '1'))
          .toString()
        return {
          name: group.name,
          amount: amount?.toString(),
          share,
          financingFee: Dec(group?.financingFee).toDecimalPlaces(2).toString(),
          riskAdjustment: Dec(group?.lossGivenDefault).mul(Dec(group.probabilityOfDefault)).div(100).toString(),
        }
      }, initialRow)
    })
    return mappedRiskGroups
  }, [metadata, loans, pool])

  // temp solution while assets are still manually priced (in the future there will be a select to choose a riskGroup)
  // represents all assets that could not be sorted into a riskGroup
  const remainingAssets: AssetByRiskGroup[] = React.useMemo(() => {
    const amountsSum = riskGroups.reduce((curr, prev) => curr.add(new BN(prev?.amount || '0')), new BN('0')).toString()
    const sharesSum = riskGroups.reduce((curr, prev) => curr.add(new BN(prev.share || '0')), new BN('0')).toString()
    return !new BN(sharesSum).eqn(100) && !new BN(sharesSum).eqn(0)
      ? [
          {
            name: 'Other',
            amount: new BN(pool?.nav.latest || '0').sub(new BN(amountsSum)).toString(),
            share: (100 - Number(sharesSum)).toString(),
            financingFee: '',
            riskAdjustment: '',
          },
        ]
      : []
  }, [pool, riskGroups])

  const totalRow = React.useMemo(() => {
    const totalSharesSum = [...riskGroups, ...remainingAssets]
      .reduce((curr, prev) => curr.add(new BN(prev.share || '0')), new BN('0'))
      .toString()
    const avgFinancingFee = riskGroups.reduce(
      (curr, prev) =>
        Dec(curr)
          .add(Dec(prev.financingFee || '0'))
          .div(Dec(riskGroups.length))
          .toDecimalPlaces(2),
      Dec('0')
    )

    const avgRiskAdjustment = riskGroups.reduce(
      (curr, prev) =>
        Dec(curr)
          .add(Dec(prev.riskAdjustment || '0'))
          .div(Dec(riskGroups.length))
          .toDecimalPlaces(2),
      Dec('0')
    )

    return {
      share: totalSharesSum,
      amount: pool?.nav.latest || '',
      name: 'Total',
      financingFee: `Avg. ${avgFinancingFee.toString()}`,
      riskAdjustment: `Avg. ${avgRiskAdjustment.toString()}`,
    }
  }, [riskGroups, remainingAssets, pool?.nav.latest])

  // biggest share of pie gets darkest color
  const dataWithColor = [...riskGroups, ...remainingAssets]
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

  const sharesForPie = dataWithColor.map(({ name, color, labelColor, share }) => {
    return { value: Number(share), name, color, labelColor }
  })

  return (
    <>
      {sharesForPie.length > 0 && (
        <Shelf justifyContent="center">
          <PieChart data={sharesForPie} />
        </Shelf>
      )}
      {dataWithColor.length > 0 ? (
        <DataTable data={[...dataWithColor] || []} columns={columns} summary={totalRow} />
      ) : (
        <Text variant="label1">No data</Text>
      )}
    </>
  )
}
