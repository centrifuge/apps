import { feeToApr, formatPercentage } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Text } from '@centrifuge/fabric'
import { BN } from '@polkadot/util'
import * as React from 'react'
import { useHistory, useParams } from 'react-router'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, OrderBy, SortableTableHeader } from './DataTable'

export type TokenByPool = {
  apy: string
  protection: string
  name: string
  symbol: string
  poolName: string
  index: number
  poolId: string
}

type RowProps = {
  token: TokenByPool
}

const columns: Column[] = [
  {
    align: 'left',
    header: (orderBy: OrderBy) => <SortableTableHeader label="Seniority" orderBy={orderBy} />,
    cell: (token: TokenByPool) => <Text variant="body2"> {token.index + 1}</Text>,
    flex: '2',
    sortKey: 'index',
  },
  {
    align: 'left',
    header: 'Name',
    cell: (token: TokenByPool) => <TokenName token={token} />,
    flex: '3',
  },
  {
    header: 'Symbol',
    cell: (token: TokenByPool) => <Text variant="body2">{token?.symbol}</Text>,
    flex: '2',
    align: 'left',
    sortKey: 'symbol',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="Min. Protection" orderBy={orderBy} />,
    cell: (token: TokenByPool) => <Protection token={token} />,
    flex: '2',
    sortKey: 'protection',
  },
  {
    header: (orderBy: OrderBy) => <SortableTableHeader label="APY" orderBy={orderBy} />,
    cell: (token: TokenByPool) => <APY token={token} />,
    flex: '2',
    sortKey: 'apy',
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 1 52px',
  },
]

export const TokenListByPool: React.FC = () => {
  const history = useHistory()
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid)
  const { data: metadata } = usePoolMetadata(pool)

  if (!pool || !pool.tranches) return null

  const tokens: TokenByPool[] = pool?.tranches
    .map((tranche) => {
      return {
        apy: tranche?.interestPerSec ? feeToApr(tranche?.interestPerSec) : '',
        protection: tranche.ratio,
        name: tranche.name,
        symbol: metadata?.tranches?.find((_, index) => index === tranche.index)?.symbol || '',
        poolName: metadata?.pool?.name || '',
        index: tranche.index,
        poolId: pid,
      }
    })
    .reverse()

  return (
    <DataTable
      data={tokens}
      columns={columns}
      defaultSortKey="valueLocked"
      onRowClicked={(token: TokenByPool) => {
        history.push(`/tokens/${token.poolId}/${token.index}`)
      }}
    />
  )
}

const TokenName: React.VFC<RowProps> = ({ token }) => {
  return (
    <Text variant="body2" color="textPrimary" fontWeight={600}>
      {token?.poolName} {token?.name}
    </Text>
  )
}

const APY: React.VFC<RowProps> = ({ token }) => {
  const apr = parseInt(token?.apy || '0', 10)
  return <Text variant="body2">{apr > 0 ? `${apr.toPrecision(3)}%` : ''}</Text>
}

const Protection: React.VFC<RowProps> = ({ token }) => {
  return <Text variant="body2">{formatPercentage(token.protection, new BN(10).pow(new BN(18)).toString())}</Text>
}
