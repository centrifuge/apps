import { Pool, Tranche } from '@centrifuge/centrifuge-js'
import { IconArrowDown, IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import * as React from 'react'
import { useHistory } from 'react-router'
import { usePoolMetadata } from '../utils/usePools'
import { useCentrifuge } from './CentrifugeProvider'
import { Column, DataTable, OrderBy } from './DataTable'
import { TokenAvatar } from './TokenAvatar'

type Props = {
  pools: Pool[]
}

type Row = Tranche & {
  poolMetadata: string
  yield: string
  protection: string
}

type RowProps = {
  token: Row
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (token: Row) => <TokenName token={token} />,
    flex: '2',
  },
  {
    align: 'left',
    header: 'Asset class',
    cell: (token: Row) => <AssetClass token={token} />,
    flex: '2',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Yield" orderBy={orderBy} />,
    cell: (token: Row) => <Yield token={token} />,
    flex: '1',
    sortKey: 'yield',
  },
  {
    header: (orderBy: OrderBy) => <SortableHeader label="Protection" orderBy={orderBy} />,
    cell: (token: Row) => <Protection token={token} />,
    flex: '1',
    sortKey: 'protection',
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 0 72px',
  },
]

export const TokenList: React.FC<Props> = ({ pools }) => {
  const history = useHistory()
  const { utils } = useCentrifuge()
  const tokens = React.useMemo(
    () =>
      pools
        ?.map((pool) =>
          pool.tranches.map((tranche) => ({
            ...tranche,
            poolMetadata: pool.metadata,
            // feeToApr is a temporary solution for calculating yield
            // bc we don't have a way to query for historical token prices yet
            // Use this formula when prices can be fetched: https://docs.centrifuge.io/learn/terms/#30d-drop-yield
            yield: utils.feeToApr(tranche.interestPerSec),
            // for now proctection is being calculated as a percentage of the ratio
            // replace with proper protection calculation when token prices are available
            protection: tranche.ratio,
          }))
        )
        .flat(),
    [pools, utils]
  )

  return (
    <DataTable
      data={tokens}
      columns={columns}
      onRowClicked={(token: Row) => {
        history.push(`/tokens/${token.name}`)
      }}
    />
  )
}

const TokenName: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata } = usePoolMetadata({ metadata: token.poolMetadata })
  const symbol = metadata?.tranches?.find((_, index) => index === token.index)?.symbol
  return (
    <Shelf gap="2">
      <TokenAvatar label={symbol || ''} size="small" />
      <Text variant="body2" color="textPrimary" fontWeight={600}>
        {metadata?.pool?.name || 'Nameless Pool'} {token?.name}
      </Text>
    </Shelf>
  )
}

const AssetClass: React.VFC<RowProps> = ({ token }) => {
  const { data: metadata } = usePoolMetadata({ metadata: token.poolMetadata })
  return <Text variant="body2">{metadata?.pool?.asset.class || '-'}</Text>
}

const Yield: React.VFC<RowProps> = ({ token }) => {
  const apr = parseInt(token.yield, 10)
  return <Text variant="body2">{apr > 0 ? `Target: ${apr.toFixed(2)}%` : '-'}</Text>
}

const Protection: React.VFC<RowProps> = ({ token }) => {
  const { utils } = useCentrifuge()
  return (
    <Text variant="body2">
      {parseInt(token.protection, 10) > 0
        ? utils.formatPercentage(token.protection, new BN(10).pow(new BN(18)).toString())
        : '-'}
    </Text>
  )
}

const SortableHeader: React.VFC<{ label: string; orderBy: OrderBy }> = ({ label, orderBy }) => {
  return (
    <Shelf>
      {label}
      <IconArrowDown
        color="textSecondary"
        size={16}
        style={{ transform: orderBy === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
      />
    </Shelf>
  )
}
