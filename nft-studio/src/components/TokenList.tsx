import { IconArrowDown, IconChevronRight, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, OrderBy } from './DataTable'

export type Token = {
  poolMetadata?: string
  yield: Decimal | null
  protection: Decimal
  valueLocked: Decimal
  currency: string
  id: string
  seniority: number
  poolId: string
}

type Props = {
  tokens: Token[]
}

type RowProps = {
  token: Token
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (token: Token) => <TokenName token={token} />,
    flex: '9',
  },
  {
    align: 'left',
    header: 'Asset class',
    cell: (token: Token) => <AssetClass token={token} />,
    flex: '4',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Yield" orderBy={orderBy} />,
    cell: (token: Token) => <Yield token={token} />,
    flex: '4',
    sortKey: 'yield',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Protection" orderBy={orderBy} />,
    cell: (token: Token) => <Protection token={token} />,
    flex: '4',
    sortKey: 'protection',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Value locked" orderBy={orderBy} />,
    cell: (token: Token) => <ValueLocked token={token} />,
    flex: '4',
    sortKey: 'valueLocked',
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 1 52px',
  },
]

export const TokenList: React.FC<Props> = ({ tokens }) => {
  const history = useHistory()

  return (
    <DataTable
      data={tokens}
      columns={columns}
      defaultSortKey="valueLocked"
      rounded={false}
      onRowClicked={(token: Token) => {
        history.push(`/tokens/${token.poolId}/${token.id}`)
      }}
    />
  )
}

const TokenName: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata } = usePoolMetadata({ metadata: token.poolMetadata })
  const pool = usePool(token.poolId)
  const tranche = pool?.tranches.find((t) => t.id === token.id)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.seniority] : null
  const symbol = trancheMeta?.symbol
  return (
    <Shelf gap="2">
      <Thumbnail label={symbol || ''} size="small" />
      <Text variant="body2" color="textPrimary" fontWeight={600}>
        {trancheMeta?.name}
      </Text>
    </Shelf>
  )
}

const AssetClass: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata } = usePoolMetadata({ metadata: token.poolMetadata })
  return <Text variant="body2">{metadata?.pool?.asset.class}</Text>
}

const Yield: React.VFC<RowProps> = ({ token }) => {
  return (
    <Text variant="body2">
      {token.yield && !token.yield?.isZero() ? `Target: ${formatPercentage(token.yield)}` : ''}
    </Text>
  )
}

const Protection: React.VFC<RowProps> = ({ token }) => {
  return <Text variant="body2">{!token.protection.isZero() && formatPercentage(token.protection)}</Text>
}

const ValueLocked: React.VFC<RowProps> = ({ token }) => {
  return <Text variant="body2">{formatBalance(token?.valueLocked, token.currency)}</Text>
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
