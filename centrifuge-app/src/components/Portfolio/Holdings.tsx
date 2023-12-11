import { Token, TokenBalance } from '@centrifuge/centrifuge-js'
import { formatBalance, useBalances, useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  Button,
  Drawer,
  Grid,
  IconExternalLink,
  IconMinus,
  IconPlus,
  Shelf,
  Stack,
  Text,
  Thumbnail,
} from '@centrifuge/fabric'
import { useHistory, useLocation } from 'react-router-dom'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'
import { usePoolCurrencies } from '../../utils/useCurrencies'
import { usePool, usePoolMetadata, usePools } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'
import { Eththumbnail } from '../EthThumbnail'
import { Tooltips } from '../Tooltips'
import { TransferTokens } from './TransferTokens'
import { usePortfolioTokens } from './usePortfolio'

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
    header: <Tooltips type="cfgPrice" label="Token price" />,
    cell: ({ tokenPrice }: Row) => {
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalance(tokenPrice || 1, 'USD', 4)}
        </Text>
      )
    },
    align: 'left',
  },
  {
    header: <SortableTableHeader label="Position" />,
    cell: ({ currency, position }: Row) => {
      console.log('🚀 ~ currency:', currency)
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalanceAbbreviated(position || 0, currency.symbol, 2)}
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
          {formatBalanceAbbreviated(marketValue || 0, 'USD', 2)}
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
export function Holdings({ canInvestRedeem = false, address }: { canInvestRedeem?: boolean; address: string }) {
  const centBalances = useBalances(address)
  const wallet = useWallet()
  const { data: tinlakeBalances } = useTinlakeBalances()
  const pools = usePools()
  const portfolioTokens = usePortfolioTokens(address)
  const { search, pathname } = useLocation()
  const history = useHistory()
  const params = new URLSearchParams(search)
  const openDrawer = params.get('transfer') === 'cfg'
  const currencies = usePoolCurrencies()

  const CFGPrice = useCFGTokenPrice()

  const tokens = [
    ...portfolioTokens.map((token) => ({
      ...token,
      tokenPrice: token.tokenPrice.toDecimal() || Dec(0),
      canInvestRedeem,
    })),
    ...(tinlakeBalances?.tranches.filter((tranche) => !tranche.balance.isZero) || []).map((balance) => {
      const pool = pools?.find((pool) => pool.id === balance.poolId)
      const tranche = pool?.tranches.find((tranche) => tranche.id === balance.trancheId)
      return {
        position: balance.balance,
        marketValue: tranche?.tokenPrice ? balance.balance.toDecimal().mul(tranche?.tokenPrice.toDecimal()) : Dec(0),
        tokenPrice: tranche?.tokenPrice?.toDecimal() || Dec(0),
        trancheId: balance.trancheId,
        poolId: balance.poolId,
        currency: tranche?.currency,
        canInvestRedeem,
      }
    }),
    ...(centBalances?.currencies
      ?.filter((currency) => currency.balance.gtn(0))
      .map((currency) => {
        const token = currencies?.find((curr) => curr.symbol === currency.currency.symbol)
        return {
          currency: token,
          poolId: '',
          trancheId: '',
          position: currency.balance.toDecimal() || Dec(0),
          tokenPrice: Dec(1),
          marketValue: currency.balance.toDecimal() || Dec(0),
          canInvestRedeem: false,
        }
      }) || []),
    ...(wallet.connectedNetworkName === 'Centrifuge'
      ? [
          {
            currency: {
              ...centBalances?.native.currency,
              name: centBalances?.native.currency.symbol,
              key: 'centrifuge',
              isPoolCurrency: false,
              isPermissioned: false,
            },
            poolId: '',
            trancheId: '',
            position: centBalances?.native.balance,
            tokenPrice: CFGPrice ? Dec(CFGPrice) : Dec(0),
            marketValue: CFGPrice ? centBalances?.native.balance.toDecimal().mul(CFGPrice) : Dec(0),
            canInvestRedeem: false,
          },
        ]
      : []),
  ]

  return tokens.length ? (
    <Stack as="article" gap={2}>
      <Drawer isOpen={openDrawer} onClose={() => history.replace(pathname)}>
        <TransferTokens address={address} />
      </Drawer>
      <Text as="h2" variant="heading2">
        Holdings
      </Text>
      <DataTable
        columns={columns}
        data={tokens}
        defaultSortKey="position"
        onRowClicked={(row) =>
          row.currency?.symbol === centBalances?.native.currency.symbol ||
          centBalances?.currencies.find((curr) => curr.currency.symbol === row.currency?.symbol)
            ? `${pathname}?transfer=cfg`
            : pathname
        }
      />
    </Stack>
  ) : null
}

const TokenWithIcon = ({ poolId, currency }: Row) => {
  const pool = usePool(poolId, false)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const { sizes } = useTheme()
  const icon = metadata?.pool?.icon?.uri
    ? cent.metadata.parseMetadataUrl(metadata.pool.icon.uri)
    : !poolId
    ? cent.metadata.parseMetadataUrl('ipfs://Qmbo43MdtokiRQ5fTLT8FoYZo6kJrW56vUqXjqYQY6Fg9f')
    : null
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
