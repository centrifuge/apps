import { feeToApr, formatCurrencyAmount, fromRate } from '@centrifuge/centrifuge-js'
import { Box, IconArrowDown, IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import styled, { useTheme } from 'styled-components'
import { Dec } from '../utils/Decimal'
import { useLoans } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, OrderBy } from './DataTable'

export type AssetByRiskGroup = {
  name: string
  amount: string
  share: string
  financingFee: string
  riskAdjustment: string
  index?: number
}

type RowProps = {
  riskGroup: AssetByRiskGroup
}

const columns: Column[] = [
  {
    align: 'left',
    header: (orderBy: OrderBy) => <SortableHeader label="Risk group" orderBy={orderBy} />,
    cell: (riskGroup: AssetByRiskGroup) => <Name riskGroup={riskGroup} />,
    flex: '1',
    sortKey: 'name',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Amount" orderBy={orderBy} />,
    cell: (riskGroup: AssetByRiskGroup) => <Amount riskGroup={riskGroup} />,
    flex: '1',
    sortKey: 'amount',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Share" orderBy={orderBy} />,
    cell: (riskGroup: AssetByRiskGroup) => <Share riskGroup={riskGroup} />,
    flex: '1',
    sortKey: 'share',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Finanacing fee" orderBy={orderBy} />,
    cell: ({ financingFee }: AssetByRiskGroup) => <Text variant="body2">{financingFee}%</Text>,
    flex: '1',
    sortKey: 'financingFee',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Risk adjustment" orderBy={orderBy} />,
    cell: ({ riskAdjustment }: AssetByRiskGroup) => <Text variant="body2">{riskAdjustment}%</Text>,
    flex: '1',
    sortKey: 'riskAdjustment',
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 1 52px',
  },
]

export const AssetByRiskGroup: React.FC = () => {
  const { pid } = useParams<{ pid: string }>()
  const loans = useLoans(pid)
  const pool = usePool(pid)
  const { data: metadata } = usePoolMetadata(pool)

  const assetsByRiskGroup = React.useMemo(() => {
    return metadata?.riskGroups?.map((group) => {
      return loans
        ?.filter((loan) => {
          // we don't handle other loan types yet
          if (loan.loanInfo.type === 'BulletLoan')
            return (
              // find loans that have matching number to risk group to determine which one they belong to (we don't store associations on chain)
              fromRate(loan.loanInfo?.lossGivenDefault) === Dec(group.lossGivenDefault).div(100).toString() &&
              fromRate(loan.loanInfo?.probabilityOfDefault) === Dec(group.probabilityOfDefault).div(100).toString() &&
              fromRate(loan.loanInfo?.lossGivenDefault) === Dec(group.lossGivenDefault).div(100).toString() &&
              fromRate(loan.loanInfo?.advanceRate) === Dec(group.advanceRate).div(100).toString() &&
              feeToApr(loan?.financingFee) === Dec(group.financingFee).toDecimalPlaces(2).toString()
            )
          return false
        })
        .reduce<AssetByRiskGroup>(
          (prev, curr) => {
            const amount = new BN(prev.amount).add(new BN(curr.outstandingDebt))
            const share = amount
              .muln(100)
              .div(new BN(pool?.nav.latest || '1'))
              .toString()
            return {
              name: group.name,
              amount: amount.toString(),
              share,
              financingFee: group.financingFee,
              riskAdjustment: Dec(group.lossGivenDefault).mul(Dec(group.probabilityOfDefault)).div(100).toString(),
            }
          },
          { name: '', amount: '0', share: '0', financingFee: '0', riskAdjustment: '0' }
        )
    })
  }, [metadata, loans, pool])

  return (
    <DataTable
      data={assetsByRiskGroup || []}
      columns={columns}
      defaultSortKey="valueLocked"
      onRowClicked={(token: AssetByRiskGroup) => {
        // history.push(`/tokens/${poolId}/${token.index}`)
        console.log('do something')
      }}
    />
  )
}

const Name: React.VFC<RowProps> = ({ riskGroup }) => {
  const theme = useTheme()
  return (
    <Shelf gap="1">
      <Box width="10px" height="10px" backgroundColor="red" /> {riskGroup.name}
    </Shelf>
  )
}

const Amount: React.VFC<RowProps> = ({ riskGroup }) => {
  return <Text variant="body2">{formatCurrencyAmount(riskGroup.amount)}</Text>
}

const Share: React.VFC<RowProps> = ({ riskGroup }) => {
  return <Text variant="body2">{riskGroup.share}%</Text>
}

const SortableHeader: React.VFC<{ label: string; orderBy?: OrderBy }> = ({ label, orderBy }) => {
  return (
    <StyledHeader>
      {label}
      <IconArrowDown
        color={orderBy ? 'currentColor' : 'transparent'}
        size={16}
        style={{ transform: orderBy === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
      />
    </StyledHeader>
  )
}

const StyledHeader = styled(Shelf)`
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover,
  &:hover > svg {
    color: ${({ theme }) => theme.colors.textInteractiveHover};
  }
`
