import { Pool } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Card, Grid, IconChevronRight, Shelf, TextWithPlaceholder, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { usePoolMetadata } from '../utils/usePools'
import { Eththumbnail } from './EthThumbnail'
import { LabelValueStack } from './LabelValueStack'
import { Tooltips } from './Tooltips'

type PoolCardProps = {
  // Not passing a pool shows a placeholder card
  pool?: Pool | TinlakePool
}

const Anchor = styled(Grid)`
  place-items: center;
  color: ${({ theme }) => theme.colors.textInteractive};

  &:active {
    color: ${({ theme }) => theme.colors.textInteractive};
  }

  &:focus-visible {
    outline: ${({ theme }) => `2px solid ${theme.colors.textInteractive}`};
  }

  svg {
    transition: transform 0.15s;
  }

  &:hover svg {
    transform: translateX(5px);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`

export function PoolCard({ pool }: PoolCardProps) {
  const cent = useCentrifuge()
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
  const { data: metadata } = usePoolMetadata(pool)
  const mostSeniorTranche = pool?.tranches?.slice(1).at(-1)

  return (
    <Card role="article" variant="interactive">
      <Grid as="header" gridTemplateColumns="40px 1fr" alignItems="start" gap={1} p={2}>
        <Eththumbnail show={pool?.id.startsWith('0x')}>
          {metadata?.pool?.icon?.uri ? (
            <img src={cent.metadata.parseMetadataUrl(metadata?.pool?.icon?.uri)} alt="" height="40" width="40" />
          ) : (
            <Thumbnail type="pool" label="LP" size="large" />
          )}
        </Eththumbnail>

        <Grid position="relative" gridTemplateColumns="1fr 30px" alignItems="center" gap={1}>
          <Box>
            <TextWithPlaceholder as="h2" variant="heading3" color="textInteractive" isLoading={!metadata}>
              {metadata?.pool?.name}
            </TextWithPlaceholder>

            <TextWithPlaceholder as="span" variant="body2" isLoading={!metadata}>
              {metadata?.pool?.asset.class}
            </TextWithPlaceholder>
          </Box>

          {pool && (
            <Anchor
              forwardedAs={Link}
              gridTemplateColumns="1fr"
              width={30}
              height={30}
              borderRadius="tooltip"
              to={`${basePath}/${pool.id}`}
              aria-label="Go to pool details"
            >
              <IconChevronRight />
            </Anchor>
          )}
        </Grid>
      </Grid>

      <Box as="hr" height="1px" backgroundColor="borderSecondary" border="none" />

      <Shelf as="dl" gap="6" p={2} justifyContent="flex-start">
        <LabelValueStack
          label={
            pool ? <Tooltips type="valueLocked" variant="secondary" props={{ poolId: pool.id }} /> : 'Value locked'
          }
          value={
            pool ? (
              formatBalance(pool.nav.latest.toFloat() + pool.reserve.total.toFloat(), pool.currency.symbol)
            ) : (
              <TextWithPlaceholder isLoading />
            )
          }
          renderAs={{ label: 'dt', value: 'dd' }}
        />
        <LabelValueStack
          label="Capacity"
          value={
            pool ? (
              formatBalance(pool.tranches.at(-1)!.capacity, pool.currency.symbol)
            ) : (
              <TextWithPlaceholder isLoading />
            )
          }
          renderAs={{ label: 'dt', value: 'dd' }}
        />
        {mostSeniorTranche && mostSeniorTranche.interestRatePerSec && (
          <LabelValueStack
            label="Senior APY"
            value={formatPercentage(mostSeniorTranche.interestRatePerSec.toAprPercent())}
            renderAs={{ label: 'dt', value: 'dd' }}
          />
        )}
      </Shelf>
    </Card>
  )
}
