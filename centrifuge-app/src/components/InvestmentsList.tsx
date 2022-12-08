import { AccountTokenBalance } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, TextWithPlaceholder, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalance } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'

type Props = {
  investments: AccountTokenBalance[]
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (i: AccountTokenBalance) => <Token investment={i} />,
    flex: '1 1 300px',
  },
  {
    align: 'left',
    header: 'Asset class',
    cell: (i: AccountTokenBalance) => <AssetClass investment={i} />,
    flex: '2 1 250px',
  },
  {
    header: 'Token balance',
    cell: (i: AccountTokenBalance) => <TokenBalance investment={i} />,
  },
  {
    header: 'Value',
    cell: (i: AccountTokenBalance) => <TokenValue investment={i} />,
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 0 72px',
  },
]

export const InvestmentsList: React.FC<Props> = ({ investments }) => {
  return (
    <DataTable
      data={investments}
      columns={columns}
      onRowClicked={(i: AccountTokenBalance) => `/tokens/${i.poolId}/${i.trancheId}`}
    />
  )
}

const Token: React.VFC<{ investment: AccountTokenBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const { data: metadata, isLoading } = usePoolMetadata(pool)
  const tranche = pool?.tranches.find((t) => t.id === investment.trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.id] : null
  return (
    <Shelf gap="2">
      <Thumbnail label={trancheMeta?.symbol || ''} size="small" />
      <TextWithPlaceholder isLoading={isLoading} variant="body2" color="textPrimary" fontWeight={600}>
        {metadata?.pool?.name} {trancheMeta?.name}
      </TextWithPlaceholder>
    </Shelf>
  )
}

const AssetClass: React.VFC<{ investment: AccountTokenBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  return <>{metadata?.pool?.asset.class}</>
}

const TokenBalance: React.VFC<{ investment: AccountTokenBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const tranche = pool?.tranches.find((t) => t.id === investment.trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.id] : null

  return <>{formatBalance(investment.balance.toFloat(), trancheMeta?.symbol)}</>
}

const TokenValue: React.VFC<{ investment: AccountTokenBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const tranche = pool?.tranches.find((t) => t.id === investment.trancheId)

  return (
    <>{formatBalance(investment.balance.toFloat() * (tranche?.tokenPrice?.toFloat() ?? 1), pool?.currency.symbol)}</>
  )
}
