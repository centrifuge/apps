import { Pool } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Grid, TextWithPlaceholder, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { useTheme } from 'styled-components'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getPoolValueLocked } from '../../utils/getPoolValueLocked'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { usePoolMetadata } from '../../utils/usePools'
import { Eththumbnail } from '../EthThumbnail'
import { PoolStatus } from './PoolStatus'
import { Anchor, Ellipsis, Root } from './styles'

// Not passing a pool shows a placeholder card

export function PoolCard({ pool }: { pool?: Pool | TinlakePool }) {
  const cent = useCentrifuge()
  const { data: metadata } = usePoolMetadata(pool)
  const mostSeniorTranche = pool?.tranches?.slice(1).at(-1)
  const apr = mostSeniorTranche?.interestRatePerSec
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
  const { sizes } = useTheme()

  return (
    <Root as="article">
      <Grid gridTemplateColumns="235px 210px 140px 70px 1fr" gap={4} p={2} alignItems="center">
        <Grid as="header" gridTemplateColumns={`${sizes.iconMedium}px 1fr`} alignItems="center" gap={2}>
          <Eththumbnail show={pool?.id.startsWith('0x')}>
            {metadata?.pool?.icon?.uri ? (
              <Box
                as="img"
                src={cent.metadata.parseMetadataUrl(metadata?.pool?.icon?.uri)}
                alt=""
                height="iconMedium"
                width="iconMedium"
              />
            ) : (
              <Thumbnail type="pool" label="LP" size="small" />
            )}
          </Eththumbnail>

          <TextWithPlaceholder as="h2" variant="body2" color="textPrimary" isLoading={!metadata}>
            <Ellipsis>{metadata?.pool?.name}</Ellipsis>
          </TextWithPlaceholder>
        </Grid>

        <TextWithPlaceholder as="span" variant="body2" color="textSecondary" isLoading={!metadata}>
          <Ellipsis>{metadata?.pool?.asset.class}</Ellipsis>
        </TextWithPlaceholder>

        <TextWithPlaceholder as="span" variant="body1" color="textPrimary" isLoading={!pool} textAlign="right">
          <Ellipsis>{pool ? formatBalance(getPoolValueLocked(pool), pool.currency.symbol) : '-'}</Ellipsis>
        </TextWithPlaceholder>

        <TextWithPlaceholder
          as="span"
          variant="body1"
          color="textPrimary"
          fontWeight={500}
          isLoading={!pool}
          textAlign="right"
        >
          <Ellipsis>
            {apr
              ? formatPercentage(apr.toAprPercent(), true, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              : '—'}
          </Ellipsis>
        </TextWithPlaceholder>

        <Box>
          <PoolStatus pool={pool} />
        </Box>
      </Grid>

      {!!pool && <Anchor to={`${basePath}/${pool.id}`} aria-label="Go to pool details" />}
    </Root>
  )
}
