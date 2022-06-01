import { TrancheBalance } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router'
import { formatBalance } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'
import { TextWithPlaceholder } from './TextWithPlaceholder'

type Props = {
  investments: TrancheBalance[]
}

export const InvestmentsList: React.FC<Props> = ({ investments }) => {
  const history = useHistory()

  const columns: Column[] = [
    {
      align: 'left',
      header: 'Token',
      cell: (i: TrancheBalance) => <Token investment={i} />,
      flex: '1 1 300px',
    },
    {
      align: 'left',
      header: 'Asset class',
      cell: (i: TrancheBalance) => <AssetClass investment={i} />,
      flex: '2 1 250px',
    },
    {
      header: 'Token balance',
      cell: (i: TrancheBalance) => <TokenBalance investment={i} />,
    },
    {
      header: 'Value',
      cell: (i: TrancheBalance) => <TokenValue investment={i} />,
    },
    {
      header: '',
      cell: () => <IconChevronRight size={24} color="textPrimary" />,
      flex: '0 0 72px',
    },
  ]
  return (
    <DataTable
      data={investments}
      columns={columns}
      onRowClicked={(i: TrancheBalance) => {
        history.push(`/tokens/${i.poolId}/${i.trancheId}`)
      }}
    />
  )
}

const Token: React.VFC<{ investment: TrancheBalance }> = ({ investment }) => {
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

const AssetClass: React.VFC<{ investment: TrancheBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  return <Text variant="body2">{metadata?.pool?.asset.class}</Text>
}

const TokenBalance: React.VFC<{ investment: TrancheBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const tranche = pool?.tranches.find((t) => t.id === investment.trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.id] : null

  return <Text variant="body2">{formatBalance(investment.balance.toFloat(), trancheMeta?.symbol)}</Text>
}

const TokenValue: React.VFC<{ investment: TrancheBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const tranche = pool?.tranches.find((t) => t.id === investment.trancheId)

  return (
    <Text variant="body2">
      {formatBalance(investment.balance.toFloat() * (tranche?.tokenPrice.toFloat() ?? 1), pool?.currency)}
    </Text>
  )
}
