import { Perquintill, Rate } from '@centrifuge/centrifuge-js'
import { Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { Column, DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { formatPercentage } from '../../../utils/formatting'
import { usePool, usePoolMetadata } from '../../../utils/usePools'

type Row = {
  minRiskBuffer: Perquintill
  interest: Rate
  name: string
  symbol: string
  seniority: number
  id: string
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token name',
    cell: (token: Row) => (
      <Shelf gap="2" overflow="hidden">
        <Thumbnail label={token.symbol || ''} size="small" />
        <Text variant="body2" color="textPrimary" fontWeight={600} textOverflow="ellipsis">
          {token.name}
        </Text>
      </Shelf>
    ),
    flex: '3',
  },
  {
    align: 'left',
    header: 'Token symbol',
    cell: (token: Row) => token.symbol,
    flex: '3',
  },
  {
    align: 'right',
    header: 'Minimum protection',
    cell: (token: Row) => (token.minRiskBuffer ? formatPercentage(token.minRiskBuffer) : '-'),
    flex: '3',
  },
  {
    align: 'right',
    header: 'Fixed interest (APR)',
    cell: (token: Row) => (token.interest ? formatPercentage(token.interest.toAprPercent()) : '-'),
    flex: '3',
  },
]

export const Tranches: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)

  const tokens =
    pool?.tranches
      .map((tranche) => {
        return {
          minRiskBuffer: tranche.minRiskBuffer,
          interest: tranche.interestRatePerSec,
          name: metadata?.tranches?.[tranche.id]?.name || '',
          symbol: metadata?.tranches?.[tranche.id]?.symbol || '',
          seniority: Number(tranche.seniority),
          id: tranche.id,
        }
      })
      .reverse() ?? []

  return (
    <PageSection title="Tranche tokens">
      <DataTable data={tokens} columns={columns} />
    </PageSection>
  )
}
