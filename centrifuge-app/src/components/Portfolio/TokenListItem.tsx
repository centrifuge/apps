import { AccountTokenBalance } from '@centrifuge/centrifuge-js'
import { formatBalance, useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  Button,
  Grid,
  IconExternalLink,
  IconMinus,
  IconPlus,
  Shelf,
  Text,
  Thumbnail,
} from '@centrifuge/fabric'
import styled, { useTheme } from 'styled-components'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { Eththumbnail } from '../EthThumbnail'
import { Root } from '../ListItemCardStyles'
import { COLUMN_GAPS } from './InvestedTokens'

export type TokenCardProps = AccountTokenBalance

const TokenName = styled(Text)`
  text-wrap: nowrap;
`

export function TokenListItem({ balance, currency, poolId, trancheId }: TokenCardProps) {
  const { sizes } = useTheme()
  const pool = usePool(poolId, false)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()

  const isTinlakePool = poolId.startsWith('0x')

  const trancheInfo = pool?.tranches.find(({ id }) => id === trancheId)
  const icon = metadata?.pool?.icon?.uri ? cent.metadata.parseMetadataUrl(metadata.pool.icon.uri) : null

  return (
    <Root as="article" minWidth="1060px">
      <Grid gridTemplateColumns={`${COLUMN_GAPS} 1fr`} gap={3} p={2} alignItems="center">
        <Grid as="header" gridTemplateColumns={`${sizes.iconMedium}px 1fr`} alignItems="center" gap={2}>
          <Eththumbnail show={isTinlakePool}>
            {icon ? (
              <Box as="img" src={icon} alt="" height="iconMedium" width="iconMedium" />
            ) : (
              <Thumbnail type="pool" label="LP" size="small" />
            )}
          </Eththumbnail>

          <TokenName textOverflow="ellipsis" variant="body2">
            {currency.name}
          </TokenName>
        </Grid>

        <Text textOverflow="ellipsis" variant="body2">
          {formatBalance(balance, currency.symbol)}
        </Text>

        <Text textOverflow="ellipsis" variant="body2">
          {trancheInfo?.tokenPrice
            ? formatBalance(trancheInfo.tokenPrice.toDecimal(), trancheInfo.currency.symbol, 4)
            : '-'}
        </Text>

        <Text textOverflow="ellipsis" variant="body2">
          {trancheInfo?.tokenPrice
            ? formatBalance(balance.toDecimal().mul(trancheInfo.tokenPrice.toDecimal()), trancheInfo.currency.symbol, 4)
            : '-'}
        </Text>

        <Shelf gap={2} justifySelf="end">
          {isTinlakePool ? (
            <AnchorButton
              variant="tertiary"
              icon={IconExternalLink}
              href="https://legacy.tinlake.centrifuge.io/portfolio"
              target="_blank"
            >
              View on Tinlake
            </AnchorButton>
          ) : (
            <>
              <Button variant="tertiary" icon={IconMinus}>
                Redeem
              </Button>
              <Button variant="tertiary" icon={IconPlus}>
                Invest
              </Button>
            </>
          )}
        </Shelf>
      </Grid>
    </Root>
  )
}
