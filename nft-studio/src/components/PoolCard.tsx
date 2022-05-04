import { Pool } from '@centrifuge/centrifuge-js'
import { Card, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { getAge } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useAverageMaturity } from '../utils/useAverageMaturity'
import { PoolMetadata } from '../utils/usePools'
import { IssuerSection } from './IssuerSection'
import { Tooltips } from './Tooltips'

type PoolCardProps = {
  pool: Pool
  metadata: Partial<PoolMetadata> | undefined
}

export const PoolCard: React.VFC<PoolCardProps> = ({ pool, metadata }) => {
  const theme = useTheme()
  const avgMaturity = useAverageMaturity(pool.id)

  const poolCardSummaryData = [
    {
      label: <Tooltips type="valueLocked" variant="lowercase" />,
      value: formatBalance(pool.nav.latest.toFloat() + pool.reserve.total.toFloat(), pool.currency),
    },
    {
      label: <Tooltips type="age" variant="lowercase" />,
      value: getAge(pool?.createdAt),
    },
    {
      label: <Tooltips type="averageAssetMaturity" variant="lowercase" />,
      value: avgMaturity,
    },
  ]

  return (
    <Card ml="3">
      {/* pool logo */}
      <Shelf
        p="2"
        gap="1"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        {metadata?.pool?.icon ? (
          <img src={parseMetadataUrl(metadata?.pool?.icon || '')} alt="" height="24" width="24" />
        ) : (
          <Thumbnail type="pool" label="LP" size="small" />
        )}

        <Text variant="heading2" color={theme.colors.textInteractive}>
          {metadata?.pool?.name}
        </Text>
      </Shelf>
      {/* pool summary */}
      <Shelf>
        <Shelf
          gap="6"
          p="2"
          style={{
            boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
          }}
        >
          {poolCardSummaryData?.map(({ label, value }, index) => (
            <Stack gap="2px" key={`${value}-${label}-${index}`}>
              <Text variant="label2">{label}</Text>
              <Text variant="body2">{value}</Text>
            </Stack>
          ))}
        </Shelf>
      </Shelf>
      {/* pool issuer section */}
      <IssuerSection metadata={metadata} />
    </Card>
  )
}
