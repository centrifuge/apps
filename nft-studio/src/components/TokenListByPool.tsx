import { feeToApr, formatPercentage } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Text } from '@centrifuge/fabric'
import { BN } from '@polkadot/util'
import * as React from 'react'
import { useHistory, useParams } from 'react-router'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'

export type TokenByPoolTableData = {
  apy: string
  protection: string
  name: string
  symbol: string
  poolName: string
  seniority: number
  poolId: string
  id: string
}

type RowProps = {
  token: TokenByPoolTableData
}

const columns: Column[] = [
  {
    align: 'left',
    header: () => <SortableTableHeader label="Seniority" />,
    cell: (token: TokenByPoolTableData) => <Text variant="body2"> {token.seniority + 1}</Text>,
    flex: '2',
    sortKey: 'seniority',
  },
  {
    align: 'left',
    header: () => <SortableTableHeader label="Name" />,
    cell: (token: TokenByPoolTableData) => <TokenName token={token} />,
    flex: '3',
    sortKey: 'name',
  },
  {
    header: () => <SortableTableHeader label="Symbol" />,
    cell: (token: TokenByPoolTableData) => <Text variant="body2">{token?.symbol}</Text>,
    flex: '2',
    align: 'left',
    sortKey: 'symbol',
  },
  {
    header: () => <SortableTableHeader label="Min. Protection" />,
    cell: (token: TokenByPoolTableData) => <Protection token={token} />,
    flex: '2',
    sortKey: 'protection',
  },
  {
    header: () => <SortableTableHeader label="APY" />,
    cell: (token: TokenByPoolTableData) => <APY token={token} />,
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

  const tokens: TokenByPoolTableData[] = pool?.tranches
    .map((tranche) => {
      return {
        apy: tranche?.interestRatePerSec ? feeToApr(tranche?.interestRatePerSec) : '',
        protection: tranche.minRiskBuffer?.toString() || '',
        name: metadata?.tranches?.find((_, index) => index === tranche.index)?.name || '',
        symbol: metadata?.tranches?.find((_, index) => index === tranche.index)?.symbol || '',
        poolName: metadata?.pool?.name || '',
        seniority: Number(tranche.seniority),
        poolId: pid,
        id: tranche.id,
      }
    })
    .reverse()

  return (
    <DataTable
      data={tokens}
      columns={columns}
      defaultSortKey="seniority"
      onRowClicked={(token: TokenByPoolTableData) => {
        history.push(`/tokens/${token.poolId}/${token.id}`)
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
