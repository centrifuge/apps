import { Pool } from '@centrifuge/centrifuge-js'
import { IconChevronRight } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router'
import { formatBalance } from '../utils/formatting'
import { usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'
import { TextWithPlaceholder } from './TextWithPlaceholder'

type Props = {
  pools: Pool[]
}

export const PoolList: React.FC<Props> = ({ pools }) => {
  const history = useHistory()

  const columns: Column[] = [
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
      cell: (p: Pool) => formatBalance(p.value, p.currency),
    },
    {
      header: '',
      cell: () => <IconChevronRight size={24} color="textPrimary" />,
      flex: '0 0 72px',
    },
  ]
  return (
    <DataTable
      rounded={false}
      data={pools}
      columns={columns}
      onRowClicked={(p: Pool) => {
        history.push(`/pools/${p.id}`)
      }}
    />
  )
}

const PoolName: React.VFC<{ pool: Pool }> = ({ pool }) => {
  const { data, isLoading } = usePoolMetadata(pool)
  return (
    <TextWithPlaceholder isLoading={isLoading} variant="body2" fontWeight={600} textOverflow="ellipsis">
      {data?.pool?.name ?? 'Unnamed Pool'}
    </TextWithPlaceholder>
  )
}

const AssetClass: React.VFC<{ pool: Pool }> = ({ pool }) => {
  const { data, isLoading } = usePoolMetadata(pool)
  return (
    <TextWithPlaceholder isLoading={isLoading} variant="body2">
      {data?.pool?.asset?.class ?? 'n/a'}
    </TextWithPlaceholder>
  )
}
