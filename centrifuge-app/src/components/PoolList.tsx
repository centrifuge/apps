import { Pool } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import styled from 'styled-components'
import { formatBalance } from '../utils/formatting'
import { usePoolMetadata } from '../utils/usePools'
import { useCentrifuge } from './CentrifugeProvider'
import { Column, DataTable } from './DataTable'
import { TextWithPlaceholder } from './TextWithPlaceholder'

type Props = {
  pools: Pool[]
}

export const PoolList: React.FC<Props> = ({ pools }) => {
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''

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
  return <DataTable rounded={false} data={pools} columns={columns} onRowClicked={(p: Pool) => `${basePath}/${p.id}`} />
}

const PoolName: React.VFC<{ pool: Pool }> = ({ pool }) => {
  const { data, isLoading } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  return (
    <Shelf alignItems="center" gap={1}>
      {data?.pool?.icon ? (
        <StyledLogo src={cent.metadata.parseMetadataUrl(data.pool.icon?.uri)} alt="pool logo" height="24" width="24" />
      ) : (
        <Thumbnail
          type="pool"
          label={
            data?.pool?.name
              .split(' ')
              .map((letters) => letters[0].toUpperCase())
              .slice(0, 2)
              .join('') ?? ''
          }
          size="small"
        />
      )}
      <TextWithPlaceholder isLoading={isLoading} fontWeight={600} textOverflow="ellipsis">
        {data?.pool?.name ?? 'Unnamed Pool'}
      </TextWithPlaceholder>
    </Shelf>
  )
}

const StyledLogo = styled.img`
  border-radius: 4px;
`

const AssetClass: React.VFC<{ pool: Pool }> = ({ pool }) => {
  const { data, isLoading } = usePoolMetadata(pool)
  return <TextWithPlaceholder isLoading={isLoading}>{data?.pool?.asset?.class ?? 'n/a'}</TextWithPlaceholder>
}
