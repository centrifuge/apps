import { DetailedPool } from '@centrifuge/centrifuge-js'
import { InteractiveCard, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router'
import { useTheme } from 'styled-components'
import { PoolMetadata } from '../types'
import { getAge } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useAverageMaturity } from '../utils/useAverageMaturity'
import { IssuerSection } from './IssuerSection'
import { Tooltips } from './Tooltips'

type PoolCardProps = {
  pool: DetailedPool
  metadata: Partial<PoolMetadata> | undefined
}

export const PoolCard: React.VFC<PoolCardProps> = ({ pool, metadata }) => {
  const theme = useTheme()
  const avgMaturity = useAverageMaturity(pool.id)
  const history = useHistory()

  const poolCardSummaryData = [
    {
      label: <Tooltips type="valueLocked" variant="secondary" />,
      value: formatBalance(pool.nav.latest.toFloat() + pool.reserve.total.toFloat(), pool.currency),
    },
    {
      label: <Tooltips type="age" variant="secondary" />,
      value: getAge(pool?.createdAt),
    },
    {
      label: <Tooltips type="averageAssetMaturity" variant="secondary" />,
      value: avgMaturity,
    },
  ]

  return (
    <InteractiveCard
      bodyPadding="0"
      icon={
        metadata?.pool?.icon ? (
          <img src={parseMetadataUrl(metadata?.pool?.icon || '')} alt="" height="24" width="24" />
        ) : (
          <Thumbnail type="pool" label="LP" size="small" />
        )
      }
      variant="button"
      title={metadata?.pool?.name}
      onClick={() => history.push(`/pools/${pool.id}`)}
    >
      <Shelf
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <Shelf gap="6" p="2" justifyContent="flex-start">
          {poolCardSummaryData?.map(({ label, value }, index) => (
            <Stack gap="2px" key={`${value}-${label}-${index}`}>
              <Text variant="label2">{label}</Text>
              <Text variant="body2">{value}</Text>
            </Stack>
          ))}
        </Shelf>
      </Shelf>
      <IssuerSection metadata={metadata} p="2" />
    </InteractiveCard>
  )
}
