import { TrancheBalance } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useHistory } from 'react-router'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { useCentrifuge } from './CentrifugeProvider'
import { DataTable } from './DataTable'

type Props = {
  investments: TrancheBalance[]
}

export const InvestmentsList: React.FC<Props> = ({ investments }) => {
  const history = useHistory()

  const columns = [
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
  return (
    <Text variant="body2" fontWeight={600}>
      {metadata?.tranches?.[investment.trancheId]?.symbol}
    </Text>
  )
}

const TrancheName: React.VFC<{ investment: TrancheBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  return <Text variant="body2">{metadata?.tranches?.[investment.trancheId]?.name}</Text>
}

const TokenValue: React.VFC<{ investment: TrancheBalance }> = ({ investment }) => {
  const pool = usePool(investment.poolId)
  const centrifuge = useCentrifuge()

  return (
    <Text variant="body2">
      {centrifuge.utils.formatCurrencyAmount(
        new BN(investment.balance)
          .mul(new BN(pool?.tranches[investment.trancheId].tokenPrice ?? 1))
          .div(new BN(10).pow(new BN(27))),
        pool?.currency
      )}
    </Text>
  )
}
