import { Pool, Tranche } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import * as React from 'react'
import { useHistory } from 'react-router'
import { usePoolMetadata } from '../utils/usePools'
import { useCentrifuge } from './CentrifugeProvider'
import { DataTable } from './DataTable'
import { TokenAvatar } from './TokenAvatar'

type Props = {
  pools: Pool[]
}

type Row = Tranche & {
  pool: Pool
}

const columns = [
  {
    align: 'left',
    header: 'Token',
    cell: (i: Row) => <TokenName token={i} />,
    flex: '2',
  },
  {
    align: 'left',
    header: 'Asset class',
    cell: (i: Row) => <AssetClass token={i} />,
    flex: '2',
  },
  {
    header: 'Yield',
    cell: (i: Row) => <Yield token={i} />,
    flex: '1',
  },
  {
    header: 'Protection',
    cell: (i: Row) => <Protection token={i} />,
    flex: '1',
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 0 72px',
  },
]

export const TokenList: React.FC<Props> = ({ pools }) => {
  const history = useHistory()
  const tokens = pools?.map((pool) => pool.tranches.map((tranche) => ({ ...tranche, pool }))).flat()

  return (
    <DataTable
      data={tokens}
      columns={columns}
      onRowClicked={(i: Row) => {
        history.push(`/tokens/${i.name}`)
      }}
    />
  )
}

const TokenName: React.VFC<{ token: Row }> = ({ token }) => {
  const { data: metadata } = usePoolMetadata(token?.pool)
  const symbol = metadata?.tranches?.find((_, index) => index === token.index)?.symbol

  return (
    <Shelf gap="2">
      <TokenAvatar label={symbol || ''} size="small" />
      <Text variant="body2" color="textPrimary" fontWeight={600}>
        {metadata?.pool?.name} {token?.name}
      </Text>
    </Shelf>
  )
}

const AssetClass: React.VFC<{ token: Row }> = ({ token }) => {
  const { data: metadata } = usePoolMetadata(token?.pool)
  return <Text variant="body2">{metadata?.pool?.asset.class}</Text>
}

const Protection: React.VFC<{ token: Row }> = ({ token }) => {
  const centrifuge = useCentrifuge()
  return (
    <Text variant="body2">{centrifuge.utils.formatPercentage(token.ratio, new BN(10).pow(new BN(18)).toString())}</Text>
  )
}

const Yield: React.VFC<{ token: Row }> = ({ token }) => {
  const centrifuge = useCentrifuge()
  return <Text variant="body2">{parseInt(centrifuge.utils.feeToApr(token.interestPerSec), 10).toFixed(2)}%</Text>
}
