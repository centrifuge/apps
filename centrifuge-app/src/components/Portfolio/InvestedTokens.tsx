import { CurrencyMetadata, Price, Token, TokenBalance } from '@centrifuge/centrifuge-js'
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
  Stack,
  Text,
  Thumbnail,
} from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { usePool, usePoolMetadata, usePools } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'
import { Eththumbnail } from '../EthThumbnail'
import { usePortfolio } from './usePortfolio'

type Row = {
  currency: Token['currency']
  poolId: string
  trancheId: string
  marketValue: TokenBalance
  position: TokenBalance
  tokenPrice: TokenBalance
  canInvestRedeem: boolean
  address: string
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (token: Row) => {
      return <TokenWithIcon {...token} />
    },
  },
  {
    header: 'Token price',
    cell: ({ tokenPrice }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalance(tokenPrice.toDecimal() || 1, 'USDT', 4)}
        </Text>
      )
    },
    align: 'left',
  },
  {
    header: <SortableTableHeader label="Position" />,
    cell: ({ currency, position }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalance(position, currency.symbol)}
        </Text>
      )
    },
    sortKey: 'position',
    align: 'left',
  },
  {
    header: <SortableTableHeader label="Market value" />,
    cell: ({ marketValue }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalance(marketValue, 'USDT', 4)}
        </Text>
      )
    },
    sortKey: 'marketValue',
    align: 'left',
  },
  {
    align: 'left',
    header: '', // invest redeem buttons
    cell: ({ canInvestRedeem, poolId }: Row) => {
      const isTinlakePool = poolId.startsWith('0x')
      return (
        canInvestRedeem && (
          <Shelf gap={1} justifySelf="end">
            {isTinlakePool ? (
              <AnchorButton
                variant="tertiary"
                small
                icon={IconExternalLink}
                href="https://legacy.tinlake.centrifuge.io/portfolio"
                target="_blank"
              >
                View on Tinlake
              </AnchorButton>
            ) : (
              <>
                <Button small variant="tertiary" icon={IconMinus}>
                  Redeem
                </Button>
                <Button small variant="tertiary" icon={IconPlus}>
                  Invest
                </Button>
              </>
            )}
          </Shelf>
        )
      )
    },
  },
]

// TODO: change canInvestRedeem to default to true once the drawer is implemented
export function InvestedTokens({ canInvestRedeem = false, address }: { canInvestRedeem?: boolean; address: string }) {
  const { data: tinlakeBalances } = useTinlakeBalances()
  const pools = usePools()
  const portfolioData = usePortfolio(address)

  const trancheTokenPrices = useMemo(() => {
    if (pools) {
      return pools.reduce((acc, pool) => {
        return pool.tranches.reduce((innerAcc, tranche) => {
          innerAcc[tranche.id] = {
            currency: tranche.currency,
            tokenPrice: tranche.tokenPrice,
            poolId: tranche.poolId,
          }
          return innerAcc
        }, acc)
      }, {} as Record<string, { tokenPrice: Price | null; poolId: string; currency: CurrencyMetadata }>)
    }
  }, [pools])

  const portfolioValues = useMemo(() => {
    if (portfolioData && trancheTokenPrices) {
      return Object.keys(portfolioData)?.reduce((sum, trancheId) => {
        const tranche = portfolioData[trancheId]

        const trancheTokenPrice = trancheTokenPrices[trancheId].tokenPrice || new Price(0)

        const trancheTokensBalance = tranche.claimableTrancheTokens
          .toDecimal()
          .add(tranche.freeTrancheTokens.toDecimal())
          .add(tranche.reservedTrancheTokens.toDecimal())
          .add(tranche.pendingRedeemTrancheTokens.toDecimal())

        return [
          ...sum,
          {
            balance: trancheTokensBalance,
            marketValue: trancheTokensBalance.mul(trancheTokenPrice.toDecimal()),
            tokenPrice: trancheTokenPrice,
            trancheId: trancheId,
            poolId: trancheTokenPrices[trancheId].poolId,
            currency: trancheTokenPrices[trancheId].currency,
          },
        ]
      }, [] as { balance: Decimal; marketValue: Decimal; tokenPrice: Price; trancheId: string; poolId: string; currency: Token['currency'] }[])
    }
  }, [portfolioData, trancheTokenPrices])

  const balances = useMemo(() => {
    return [
      ...(portfolioValues || []),
      ...(tinlakeBalances?.tranches.filter((tranche) => !tranche.balance.isZero) || []).map((balance) => {
        const pool = pools?.find((pool) => pool.id === balance.poolId)
        const tranche = pool?.tranches.find((tranche) => tranche.id === balance.trancheId)
        return {
          balance: balance.balance,
          marketValue: tranche?.tokenPrice ? balance.balance.toDecimal().mul(tranche?.tokenPrice.toDecimal()) : Dec(0),
          tokenPrice: tranche?.tokenPrice || new Price(0),
          trancheId: balance.trancheId,
          poolId: balance.poolId,
          currency: tranche?.currency,
        }
      }),
    ]
  }, [portfolioValues, tinlakeBalances, pools])

  const tableData = balances.map((balance) => ({
    currency: balance.currency,
    poolId: balance.poolId,
    trancheId: balance.trancheId,
    position: balance.balance,
    tokenPrice: balance.tokenPrice,
    marketValue: balance.marketValue,
    canInvestRedeem,
  }))

  return tableData.length ? (
    <Stack as="article" gap={2}>
      <Text as="h2" variant="heading2">
        Portfolio
      </Text>
      <DataTable columns={columns} data={tableData} defaultSortKey="position" />
    </Stack>
  ) : null
}

const TokenWithIcon = ({ poolId, currency }: Row) => {
  const pool = usePool(poolId, false)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const { sizes } = useTheme()
  const icon = metadata?.pool?.icon?.uri ? cent.metadata.parseMetadataUrl(metadata.pool.icon.uri) : null
  return (
    <Grid as="header" gridTemplateColumns={`${sizes.iconMedium}px 1fr`} alignItems="center" gap={2}>
      <Eththumbnail show={!!poolId.startsWith('0x')}>
        {icon ? (
          <Box as="img" src={icon} alt="" height="iconMedium" width="iconMedium" />
        ) : (
          <Thumbnail type="pool" label="LP" size="small" />
        )}
      </Eththumbnail>

      <Text textOverflow="ellipsis" variant="body3">
        {currency.name}
      </Text>
    </Grid>
  )
}
