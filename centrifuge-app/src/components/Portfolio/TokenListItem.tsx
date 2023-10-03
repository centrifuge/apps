import { AccountTokenBalance, PoolMetadata } from '@centrifuge/centrifuge-js'
import { formatBalance } from '@centrifuge/centrifuge-react'
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
import { useTheme } from 'styled-components'
import { usePool } from '../../utils/usePools'
import { Eththumbnail } from '../EthThumbnail'
import { Ellipsis, Root } from '../ListItemCardStyles'

export type TokenCardProps = AccountTokenBalance

export function TokenListItem({ balance, currency, poolId, trancheId }: TokenCardProps) {
  const { sizes } = useTheme()
  const pool = usePool(poolId, false)

  const isTinlakePool = poolId.startsWith('0x')

  const trancheInfo = pool?.tranches.find(({ id }) => id === trancheId)
  const icon = (trancheInfo?.poolMetadata as PoolMetadata).tranches?.[trancheId].icon?.uri

  return (
    <Root as="article">
      <Grid gridTemplateColumns="150px 150px 150px 150px 1fr" gap={3} p={2} alignItems="center">
        <Grid as="header" gridTemplateColumns={`${sizes.iconMedium}px 1fr`} alignItems="center" gap={2}>
          <Eththumbnail show={isTinlakePool}>
            {icon ? (
              <Box as="img" src={icon} alt="" height="iconMedium" width="iconMedium" />
            ) : (
              <Thumbnail type="pool" label="LP" size="small" />
            )}
          </Eththumbnail>

          <Text as="h2" variant="body2" color="textPrimary">
            <Ellipsis>{currency.name}</Ellipsis>
          </Text>
        </Grid>

        <Text as="span" variant="body2" color="textPrimary">
          <Ellipsis>{formatBalance(balance, currency.symbol)}</Ellipsis>
        </Text>

        <Text as="span" variant="body2" color="textPrimary">
          <Ellipsis>
            {trancheInfo?.tokenPrice
              ? formatBalance(trancheInfo.tokenPrice.toDecimal(), trancheInfo.currency.symbol, 4)
              : '-'}
          </Ellipsis>
        </Text>

        <Text as="span" variant="body2" color="textPrimary">
          <Ellipsis>
            {trancheInfo?.tokenPrice
              ? formatBalance(
                  balance.toDecimal().mul(trancheInfo.tokenPrice.toDecimal()),
                  trancheInfo.currency.symbol,
                  4
                )
              : '-'}
          </Ellipsis>
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
