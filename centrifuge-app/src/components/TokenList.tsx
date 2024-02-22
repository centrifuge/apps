import { CurrencyMetadata, PoolMetadata } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Text, TextWithPlaceholder, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../utils/formatting'
import { usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import { Eththumbnail } from './EthThumbnail'

export type TokenTableData = {
  poolMetadata?: string | Partial<PoolMetadata>
  yield: number | null
  protection: number
  capacity: number
  valueLocked: number
  currency: CurrencyMetadata
  id: string
  seniority: number
  poolId: string
  poolCurrency: string
  tokenPrice: number
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
    width: 'minmax(200px, 3fr)',
  },
  {
    align: 'left',
    header: 'Asset class',
    width: 'minmax(100px, 2fr)',
    cell: (token: TokenTableData) => <AssetClass token={token} />,
  },
  {
    header: <SortableTableHeader label="Yield" />,
    cell: (token: TokenTableData) => (token.yield ? `Target: ${formatPercentage(token.yield)}` : ''),
    sortKey: 'yield',
  },
  {
    header: <SortableTableHeader label="Token price" />,
    cell: (token: TokenTableData) => formatBalance(token.tokenPrice, token.poolCurrency, 4, 2),
    sortKey: 'tokenPrice',
  },
  {
    header: <SortableTableHeader label="Protection" />,
    cell: (token: TokenTableData) => (token.protection ? formatPercentage(token.protection) : ''),
    sortKey: 'protection',
  },
  {
    header: <SortableTableHeader label="Value locked" />,
    cell: (token: TokenTableData) => formatBalance(token.valueLocked, token.poolCurrency),
    sortKey: 'valueLocked',
  },
  {
    header: <SortableTableHeader label="Capacity" />,
    cell: (token: TokenTableData) => (
      <Text variant="body2" fontWeight={600} color={token.capacity > 0 ? 'statusOk' : 'statusWarning'}>
        {formatBalanceAbbreviated(token.capacity, token.poolCurrency)}
      </Text>
    ),
    sortKey: 'capacity',
  },

  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    width: '52px',
  },
]

export const TokenList: React.FC<Props> = ({ tokens }) => {
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''

  return (
    <DataTable
      data={tokens}
      columns={columns}
      defaultSortKey="valueLocked"
      onRowClicked={(token: TokenTableData) => ({
        pathname: `${basePath}/${token.poolId}`,
        state: { token: token.id },
      })}
    />
  )
}

const TokenName: React.VFC<RowProps> = ({ token }) => {
  return (
    <Shelf gap="2" width="100%">
      <Eththumbnail show={token.poolId.startsWith('0x')} size="small">
        <Thumbnail label={token.currency.symbol} size="small" />
      </Eththumbnail>
      <Text variant="body2" color="textPrimary" fontWeight={600} textOverflow="ellipsis">
        {token.currency.name}
      </Text>
    </Shelf>
  )
}

const AssetClass: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata, isLoading } = usePoolMetadata({ id: token.poolId, metadata: token.poolMetadata })
  return (
    <TextWithPlaceholder isLoading={isLoading} variant="body2">
      {metadata?.pool?.asset.subClass}
    </TextWithPlaceholder>
  )
}
