import { Token, TokenBalance } from '@centrifuge/centrifuge-js'
import { formatBalance, useBalances, useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  Grid,
  IconDownload,
  IconExternalLink,
  IconMinus,
  IconPlus,
  IconSend,
  Stack,
  Text,
  Thumbnail,
  VisualButton,
} from '@centrifuge/fabric'
import React from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { useTheme } from 'styled-components'
import daiLogo from '../../assets/images/dai-logo.svg'
import ethLogo from '../../assets/images/ethereum.svg'
import centLogo from '../../assets/images/logoCentrifuge.svg'
import usdcLogo from '../../assets/images/usdc-logo.svg'
import usdtLogo from '../../assets/images/usdt-logo.svg'
import { Dec } from '../../utils/Decimal'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'
import { usePoolCurrencies } from '../../utils/useCurrencies'
import { usePool, usePoolMetadata, usePools } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'
import { Eththumbnail } from '../EthThumbnail'
import { InvestRedeemDrawer } from '../InvestRedeem/InvestRedeemDrawer'
import { Tooltips } from '../Tooltips'
import { TransferTokensDrawer } from './TransferTokensDrawer'
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
  onClickInvest?: () => void
  onClickRedeem?: () => void
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
      return (
        <Text textOverflow="ellipsis" variant="body3">
          {formatBalanceAbbreviated(position || 0, currency?.symbol, 2)}
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
    cell: ({ canInvestRedeem, poolId, trancheId, currency }: Row) => {
      const isTinlakePool = poolId.startsWith('0x')
      return (
        <Grid gap={1} justifySelf="end">
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
          ) : canInvestRedeem ? (
            <>
              <Link to={`?redeem=${poolId}-${trancheId}`}>
                <VisualButton small variant="tertiary" icon={IconMinus}>
                  Redeem
                </VisualButton>
              </Link>
              <Link to={`?invest=${poolId}-${trancheId}`}>
                <VisualButton small variant="tertiary" icon={IconPlus}>
                  Invest
                </VisualButton>
              </Link>
            </>
          ) : (
            <>
              <Link to={`?receive=${currency?.symbol}`}>
                <VisualButton small variant="tertiary" icon={IconDownload}>
                  Deposit
                </VisualButton>
              </Link>
              <Link to={`?send=${currency?.symbol}`}>
                <VisualButton small variant="tertiary" icon={IconSend}>
                  Send
                </VisualButton>
              </Link>
            </>
          )}
        </Grid>
      )
    },
  },
]

export function Holdings({ canInvestRedeem = false, address }: { canInvestRedeem?: boolean; address: string }) {
  const centBalances = useBalances(address)
  const wallet = useWallet()
  const { data: tinlakeBalances } = useTinlakeBalances()
  const pools = usePools()
  const portfolioTokens = usePortfolioTokens(address)
  const currencies = usePoolCurrencies()
  const { search, pathname } = useLocation()
  const history = useHistory()
  const params = new URLSearchParams(search)
  const openSendDrawer = params.get('send')
  const openReceiveDrawer = params.get('receive')
  const openInvestDrawer = params.get('invest')
  const openRedeemDrawer = params.get('redeem')

  const [investPoolId, investTrancheId] = openInvestDrawer?.split('-') || []
  const [redeemPoolId, redeemTrancheId] = openRedeemDrawer?.split('-') || []

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
    ...(tinlakeBalances?.currencies.filter((currency) => currency.balance.gtn(0)) || []).map((currency) => {
      return {
        position: currency.balance,
        marketValue: currency.balance.toDecimal().mul(Dec(1)),
        tokenPrice: Dec(1),
        trancheId: '',
        poolId: '',
        currency: currency.currency,
        canInvestRedeem: false,
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
      <InvestRedeemDrawer
        poolId={investPoolId || redeemPoolId || ''}
        trancheId={investTrancheId || redeemTrancheId || ''}
        open={!!(openRedeemDrawer || openInvestDrawer)}
        onClose={() => history.replace(pathname)}
        defaultView={openRedeemDrawer ? 'redeem' : 'invest'}
      />
      <TransferTokensDrawer
        address={address}
        isOpen={!!(openSendDrawer || openReceiveDrawer)}
        onClose={() => history.replace(pathname)}
      />
      <Text as="h2" variant="heading2">
        Holdings
      </Text>
      <DataTable columns={columns} data={tokens} defaultSortKey="position" />
    </Stack>
  ) : null
}

const TokenWithIcon = ({ poolId, currency }: Row) => {
  const pool = usePool(poolId, false)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const { sizes } = useTheme()

  const getIcon = () => {
    if (metadata?.pool?.icon?.uri) {
      return cent.metadata.parseMetadataUrl(metadata.pool.icon.uri)
    } else if (currency?.name?.toLowerCase()?.includes('eth')) {
      return ethLogo
    } else if (currency?.symbol?.toLowerCase() === 'dai') {
      return daiLogo
    } else if (currency?.symbol?.toLowerCase() === 'usdc') {
      return usdcLogo
    } else if (currency?.symbol?.toLowerCase() === 'usdt') {
      return usdtLogo
    } else {
      return centLogo
    }
  }
  const icon = getIcon()

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
        {currency?.name}
      </Text>
    </Grid>
  )
}
