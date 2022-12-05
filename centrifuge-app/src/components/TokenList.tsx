import { CurrencyMetadata } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../utils/formatting'
import { usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import { TextWithPlaceholder } from './TextWithPlaceholder'

export type TokenTableData = {
  poolMetadata?: string
  yield: number | null
  protection: number
  capacity: number
  valueLocked: number
  currency: CurrencyMetadata
  id: string
  seniority: number
  poolId: string
  poolCurrency: string
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
    flex: '6',
  },
  {
    header: <SortableTableHeader label="Yield" />,
    cell: (token: TokenTableData) => (token.yield ? `Target: ${formatPercentage(token.yield)}` : ''),
    flex: '4',
    sortKey: 'yield',
  },
  {
    header: <SortableTableHeader label="Protection" />,
    cell: (token: TokenTableData) => (token.protection ? formatPercentage(token.protection) : ''),
    flex: '4',
    sortKey: 'protection',
  },
  {
    header: <SortableTableHeader label="Value locked" />,
    cell: (token: TokenTableData) => formatBalance(token?.valueLocked, token.poolCurrency),
    flex: '4',
    sortKey: 'valueLocked',
  },
  {
    header: <SortableTableHeader label="Capacity" />,
    cell: (token: TokenTableData) => (
      <Text variant="body2" fontWeight={600} color={token.capacity > 0 ? 'statusOk' : 'statusWarning'}>
        {formatBalanceAbbreviated(token.capacity, token.poolCurrency)}
      </Text>
    ),
    flex: '4',
    sortKey: 'capacity',
  },

  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 1 52px',
  },
]

export const TokenList: React.FC<Props> = ({ tokens }) => {
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''

  return (
    <DataTable
      data={tokens}
      columns={columns}
      defaultSortKey="valueLocked"
      rounded={false}
      onRowClicked={(token: TokenTableData) => ({
        pathname: `${basePath}/${token.poolId}`,
        state: { token: token.id },
      })}
    />
  )
}

const TokenName: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata, isLoading } = usePoolMetadata({ metadata: token.poolMetadata })
  return (
    <Shelf gap="2" overflow="hidden">
      <Thumbnail label={token.currency.symbol} size="small" />
      <TextWithPlaceholder
        isLoading={isLoading}
        variant="body2"
        color="textPrimary"
        fontWeight={600}
        textOverflow="ellipsis"
      >
        {metadata?.pool?.name} {token.currency.name}
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
