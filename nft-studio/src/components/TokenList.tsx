import { IconChevronRight, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useHistory } from 'react-router'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, OrderBy, SortableTableHeader } from './DataTable'

export type TokenTableData = {
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
  tokens: TokenTableData[]
}

type RowProps = {
  token: TokenTableData
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (token: TokenTableData) => <TokenName token={token} />,
    flex: '9',
  },
  {
    align: 'left',
    header: 'Asset class',
    cell: (token: TokenTableData) => <AssetClass token={token} />,
    flex: '4',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Yield" orderBy={orderBy} />,
    cell: (token: TokenTableData) => <Yield token={token} />,
    flex: '4',
    sortKey: 'yield',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Protection" orderBy={orderBy} />,
    cell: (token: TokenTableData) => <Protection token={token} />,
    flex: '4',
    sortKey: 'protection',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Value locked" orderBy={orderBy} />,
    cell: (token: TokenTableData) => <ValueLocked token={token} />,
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
      onRowClicked={(token: TokenTableData) => {
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
