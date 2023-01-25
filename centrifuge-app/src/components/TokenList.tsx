import { CurrencyMetadata, PoolMetadata } from '@centrifuge/centrifuge-js'
import { Box, IconChevronRight, Shelf, Text, TextWithPlaceholder, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import ethereumLogo from '../assets/images/ethereum.svg'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../utils/formatting'
import { usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'

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
  return (
    <Shelf gap="2">
      <Box position="relative">
        <Thumbnail label={token.currency.symbol} size="small" />
        {token.poolId.startsWith('0x') && (
          <Shelf
            position="absolute"
            bottom={0}
            left={0}
            width={16}
            height={16}
            borderRadius="50%"
            background="white"
            style={{ transform: 'translate(-50%, 50%)' }}
          >
            <Box as="img" src={ethereumLogo} height={12} mx="auto" />
          </Shelf>
        )}
      </Box>
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
      {metadata?.pool?.asset.class}
    </TextWithPlaceholder>
  )
}
