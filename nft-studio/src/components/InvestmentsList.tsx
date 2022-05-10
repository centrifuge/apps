import { TrancheBalance } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router'
import { formatBalance } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'

type Props = {
  investments: TrancheBalance[]
}

export const InvestmentsList: React.FC<Props> = ({ investments }) => {
  const history = useHistory()

  const columns: Column[] = [
    {
      align: 'left',
      header: 'Pool',
      cell: (i: TrancheBalance) => <TokenSymbol investment={i} />,
      flex: '1 1 100px',
    },
    {
      align: 'left',
      header: 'Asset class',
      cell: (i: TrancheBalance) => <TrancheName investment={i} />,
      flex: '2 1 250px',
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
        history.push(`/investments/tokens/${i.poolId}/${i.trancheId}`)
      }}
    />
  )
}

const TokenSymbol: React.VFC<{ investment: TrancheBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const tranche = pool?.tranches.find((t) => t.id === investment.trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.seniority] : null
  return (
    <Text variant="body2" fontWeight={600}>
      {trancheMeta?.symbol}
    </Text>
  )
}

const TrancheName: React.VFC<{ investment: TrancheBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const tranche = pool?.tranches.find((t) => t.id === investment.trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.seniority] : null
  return <Text variant="body2">{trancheMeta?.name}</Text>
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
