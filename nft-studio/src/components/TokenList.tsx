import { IconChevronRight, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useHistory } from 'react-router'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import { TextWithPlaceholder } from './TextWithPlaceholder'

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
    header: () => <SortableTableHeader label="Token" />,
    cell: (token: TokenTableData) => <TokenName token={token} />,
    flex: '9',
    sortKey: 'token',
  },
  {
    align: 'left',
    header: 'Asset class',
    cell: (token: TokenTableData) => <AssetClass token={token} />,
    flex: '4',
  },
  {
    header: () => <SortableTableHeader label="Yield" />,
    cell: (token: TokenTableData) => <Yield token={token} />,
    flex: '4',
    sortKey: 'yield',
  },
  {
    header: () => <SortableTableHeader label="Protection" />,
    cell: (token: TokenTableData) => <Protection token={token} />,
    flex: '4',
    sortKey: 'protection',
  },
  {
    header: () => <SortableTableHeader label="Value locked" />,
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
  const { data: metadata, isLoading } = usePoolMetadata({ metadata: token.poolMetadata })
  const trancheMeta = metadata?.tranches?.[token.seniority]
  const symbol = trancheMeta?.symbol
  return (
    <Shelf gap="2">
      <Thumbnail label={symbol || ''} size="small" />
      <TextWithPlaceholder isLoading={isLoading} variant="body2" color="textPrimary" fontWeight={600}>
        {metadata?.pool?.name} {trancheMeta?.name}
      </TextWithPlaceholder>
    </Shelf>
  )
}

const AssetClass: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata, isLoading } = usePoolMetadata({ metadata: token.poolMetadata })
  return (
    <TextWithPlaceholder isLoading={isLoading} variant="body2">
      {metadata?.pool?.asset.class}
    </TextWithPlaceholder>
  )
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
