import { Rate } from '@centrifuge/centrifuge-js'
import { Box, Grid, TextWithPlaceholder, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { useTheme } from 'styled-components'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { Eththumbnail } from '../EthThumbnail'
import { PoolStatus, PoolStatusKey } from './PoolStatus'
import { Anchor, Ellipsis, Root } from './styles'

const columns_base = 'minmax(150px, 2fr) minmax(100px, 1fr) 140px 70px 150px'
const columns_extended = 'minmax(200px, 2fr) minmax(100px, 1fr) 140px 100px 150px'
export const COLUMNS = [columns_base, columns_base, columns_base, columns_extended]
export const COLUMN_GAPS = [3, 3, 6, 8]

export type PoolCardProps = {
  poolId?: string
  name?: string
  assetClass?: string
  valueLocked?: Decimal
  currencySymbol?: string
  apr?: Rate | null | undefined
  status?: PoolStatusKey
  iconUri?: string
  isLoading?: boolean
}

export function PoolCard({
  poolId,
  name,
  assetClass,
  valueLocked,
  currencySymbol,
  apr,
  status,
  iconUri,
  isLoading,
}: PoolCardProps) {
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
  const { sizes } = useTheme()

  return (
    <Root as="article">
      <Grid gridTemplateColumns={COLUMNS} gap={COLUMN_GAPS} p={2} alignItems="center">
        <Grid as="header" gridTemplateColumns={`${sizes.iconMedium}px 1fr`} alignItems="center" gap={2}>
          <Eththumbnail show={poolId?.startsWith('0x')}>
            {iconUri ? (
              <Box as="img" src={iconUri} alt="" height="iconMedium" width="iconMedium" />
            ) : (
              <Thumbnail type="pool" label="LP" size="small" />
            )}
          </Eththumbnail>

          <TextWithPlaceholder as="h2" variant="body2" color="textPrimary" isLoading={isLoading}>
            <Ellipsis>{name}</Ellipsis>
          </TextWithPlaceholder>
        </Grid>

        <TextWithPlaceholder as="span" variant="body2" color="textSecondary" isLoading={isLoading}>
          <Ellipsis>{assetClass}</Ellipsis>
        </TextWithPlaceholder>

        <TextWithPlaceholder as="span" variant="body1" color="textPrimary" textAlign="right" isLoading={isLoading}>
          <Ellipsis>{valueLocked ? formatBalance(valueLocked, currencySymbol) : '-'}</Ellipsis>
        </TextWithPlaceholder>

        <TextWithPlaceholder
          as="span"
          variant="body1"
          color="textPrimary"
          fontWeight={500}
          textAlign="right"
          isLoading={isLoading}
          maxLines={1}
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
          <PoolStatus status={status} />
        </Box>
      </Grid>

      <Anchor to={`${basePath}/${poolId}`} aria-label="Go to pool details" />
    </Root>
  )
}
