import { formatCurrencyAmount, Pool } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router'
import { usePoolMetadata } from '../utils/usePools'
import { DataTable } from './DataTable'

type Props = {
  pools: Pool[]
}

export const PoolList: React.FC<Props> = ({ pools }) => {
  const history = useHistory()

  const columns = [
    {
      align: 'left',
      header: 'Pool',
      cell: (p: Pool) => <PoolName pool={p} />,
      flex: '2 1 250px',
    },
    {
      align: 'left',
      header: 'Asset class',
      cell: (p: Pool) => <AssetClass pool={p} />,
    },
    {
      header: 'Value',
      cell: (p: Pool) => formatCurrencyAmount(p.value, p.currency),
    },
    {
      header: '',
      cell: () => <IconChevronRight size={24} color="textPrimary" />,
      flex: '0 0 72px',
    },
  ]
  return (
    <DataTable
      data={pools}
      columns={columns}
      onRowClicked={(p: Pool) => {
        history.push(`/pools/${p.id}`)
      }}
    />
  )
}

const PoolName: React.VFC<{ pool: Pool }> = ({ pool }) => {
  const { data } = usePoolMetadata(pool)
  return (
    <Text variant="body2" fontWeight={600}>
      {data?.pool?.name}
    </Text>
  )
}

const AssetClass: React.VFC<{ pool: Pool }> = ({ pool }) => {
  const { data } = usePoolMetadata(pool)
  return <Text variant="body2">{data?.pool?.asset?.class}</Text>
}
