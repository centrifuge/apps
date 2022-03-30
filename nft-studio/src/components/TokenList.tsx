import { TrancheBalance } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useHistory } from 'react-router'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { useCentrifuge } from './CentrifugeProvider'
import { DataTable } from './DataTable'

type Props = {
  tokens: TrancheBalance[]
}

export const TokenList: React.FC<Props> = ({ tokens }) => {
  const history = useHistory()

  const columns = [
    {
      align: 'left',
      header: 'Token',
      cell: (i: TrancheBalance) => <TokenName token={i} />,
      flex: '2',
    },
    {
      align: 'left',
      header: 'Asset class',
      cell: (i: TrancheBalance) => <AssetClass token={i} />,
      flex: '2',
    },
    {
      header: 'Yield',
      cell: (i: TrancheBalance) => <TokenValue token={i} />,
      flex: '1',
    },
    {
      header: 'Protection',
      cell: (i: TrancheBalance) => <TokenValue token={i} />,
      flex: '1',
    },
    {
      header: 'Capacity',
      cell: (i: TrancheBalance) => <TokenValue token={i} />,
      flex: '1',
    },
    {
      header: '',
      cell: () => <IconChevronRight size={24} color="textPrimary" />,
      flex: '0 0 72px',
    },
  ]
  return (
    <DataTable
      data={tokens}
      columns={columns}
      onRowClicked={(i: TrancheBalance) => {
        history.push(`/tokens/${i.poolId}/${i.trancheId}`)
      }}
    />
  )
}

const TokenName: React.VFC<{ token: TrancheBalance }> = ({ token }) => {
  const pool = usePool(token.poolId)
  console.log('🚀 ~ pool', pool)
  const { data: metadata } = usePoolMetadata(pool)
  return (
    <Shelf gap="2">
      <img
        height="24"
        width="24"
        src="https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/dog-halloween-costumes-1600877570.jpg?crop=0.494xw:0.987xh;0,0.0128xh&resize=640:*"
        alt=""
      />
      <Text variant="body2" fontWeight={600}>
        New Silver 2 Senior
      </Text>
    </Shelf>
  )
}

const AssetClass: React.VFC<{ token: TrancheBalance }> = ({ token }) => {
  // const pool = usePool(token.poolId)
  // const { data: metadata } = usePoolMetadata(pool)
  return <Text variant="body2">Art NFT</Text>
}

const TokenValue: React.VFC<{ token: TrancheBalance }> = ({ token }) => {
  const pool = usePool(token.poolId)
  const centrifuge = useCentrifuge()

  return (
    <Text variant="body2">
      {centrifuge.utils.formatCurrencyAmount(
        new BN(token.balance)
          .mul(new BN(pool?.tranches[token.trancheId].tokenPrice ?? 1))
          .div(new BN(10).pow(new BN(27))),
        pool?.currency
      )}
    </Text>
  )
}
