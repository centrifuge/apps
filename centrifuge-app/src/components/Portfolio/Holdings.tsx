import { Token, evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { formatBalance, useBalances, useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import { Box, Grid, IconDownload, IconMinus, IconPlus, IconSend, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useMatch, useNavigate } from 'react-router'
import { useLocation } from 'react-router-dom'
import { useTheme } from 'styled-components'
import daiLogo from '../../assets/images/dai-logo.svg'
import ethLogo from '../../assets/images/ethereum.svg'
import centLogo from '../../assets/images/logoCentrifuge.svg'
import usdcLogo from '../../assets/images/usdc-logo.svg'
import usdtLogo from '../../assets/images/usdt-logo.svg'
import { Dec } from '../../utils/Decimal'
import { isEvmAddress } from '../../utils/address'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useTinlakePools } from '../../utils/tinlake/useTinlakePools'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'
import { usePoolCurrencies } from '../../utils/useCurrencies'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'
import { Eththumbnail } from '../EthThumbnail'
import { InvestRedeemDrawer } from '../InvestRedeem/InvestRedeemDrawer'
import { RouterLinkButton } from '../RouterLinkButton'
import { Tooltips } from '../Tooltips'
import { TransferTokensDrawer } from './TransferTokensDrawer'
import { usePortfolioTokens } from './usePortfolio'

export type Holding = {
  currency: Token['currency']
  poolId: string
  trancheId: string
  marketValue: Decimal
  position: Decimal
  tokenPrice: Decimal
  showActions?: boolean
  address?: string
  connectedNetwork?: string | null
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Token',
    cell: (token: Holding) => {
      return <TokenWithIcon {...token} />
    },
  },
  {
    header: <Tooltips type="cfgPrice" label="Token price" />,
    cell: ({ tokenPrice }: Holding) => {
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
    cell: ({ currency, position }: Holding) => {
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
    cell: ({ marketValue }: Holding) => {
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
    align: 'right',
    header: '', // invest redeem buttons
    width: 'max-content',
    cell: ({ showActions, poolId, trancheId, currency, connectedNetwork }: Holding) => {
      return (
        <Grid gap={1} justifySelf="end">
          {showActions ? (
            trancheId ? (
              <Shelf>
                <RouterLinkButton to={`?receive=${poolId}.${trancheId}`} small variant="tertiary" icon={IconDownload}>
                  Receive
                </RouterLinkButton>
                <RouterLinkButton to={`?send=${poolId}.${trancheId}`} small variant="tertiary" icon={IconSend}>
                  Send
                </RouterLinkButton>
                <RouterLinkButton to={`?redeem=${poolId}.${trancheId}`} small variant="tertiary" icon={IconMinus}>
                  Redeem
                </RouterLinkButton>
                <RouterLinkButton to={`?invest=${poolId}.${trancheId}`} small variant="tertiary" icon={IconPlus}>
                  Invest
                </RouterLinkButton>
              </Shelf>
            ) : connectedNetwork === 'Centrifuge' ? (
              <Shelf>
                <RouterLinkButton to={`?receive=${currency?.symbol}`} small variant="tertiary" icon={IconDownload}>
                  Receive
                </RouterLinkButton>
                <RouterLinkButton to={`?send=${currency?.symbol}`} small variant="tertiary" icon={IconSend}>
                  Send
                </RouterLinkButton>
              </Shelf>
            ) : null
          ) : null}
        </Grid>
      )
    },
  },
]

export function useHoldings(address?: string, chainId?: number, showActions = true) {
  const centAddress = address && chainId && isEvmAddress(address) ? evmToSubstrateAddress(address, chainId) : address
  const { data: tinlakeBalances } = useTinlakeBalances(address && isEvmAddress(address) ? address : undefined)
  const centBalances = useBalances(centAddress)
  const match = useMatch('/portfolio')
  const isPortfolioPage = Boolean(match)

  const wallet = useWallet()
  const tinlakePools = useTinlakePools()
  const portfolioTokens = usePortfolioTokens(centAddress)
  const currencies = usePoolCurrencies()
  const CFGPrice = useCFGTokenPrice()

  const tokens: Holding[] = [
    ...portfolioTokens.map((token) => ({
      ...token,
      tokenPrice: token.tokenPrice.toDecimal() || Dec(0),
      showActions,
    })),
    ...(tinlakeBalances?.tranches.filter((tranche) => !tranche.balancePending.isZero()) || []).map((balance) => {
      const pool = tinlakePools.data?.pools?.find((pool) => pool.id === balance.poolId)
      const tranche = pool?.tranches.find((tranche) => tranche.id === balance.trancheId)
      if (!tranche) return null as never
      return {
        position: balance.balancePending.toDecimal(),
        marketValue: tranche.tokenPrice
          ? balance.balancePending.toDecimal().mul(tranche?.tokenPrice.toDecimal())
          : Dec(0),
        tokenPrice: tranche.tokenPrice?.toDecimal() || Dec(0),
        trancheId: balance.trancheId,
        poolId: balance.poolId,
        currency: tranche.currency,
        showActions,
        connectedNetwork: wallet.connectedNetworkName,
      }
    }),
    ...(tinlakeBalances?.currencies.filter((currency) => currency.balance.gtn(0)) || []).map((currency) => {
      const tokenPrice = currency.currency.symbol === 'wCFG' ? CFGPrice ?? 0 : 1
      return {
        position: currency.balance.toDecimal(),
        marketValue: currency.balance.toDecimal().mul(Dec(tokenPrice)),
        tokenPrice: Dec(tokenPrice),
        trancheId: '',
        poolId: '',
        currency: currency.currency,
        showActions: false,
        connectedNetwork: wallet.connectedNetworkName,
      }
    }),
    ...(centBalances?.currencies
      ?.filter((currency) => currency.balance.gtn(0))
      .map((currency) => {
        const token = currencies?.find((curr) => curr.symbol === currency.currency.symbol)
        if (!token) return null as never
        return {
          currency: token,
          poolId: '',
          trancheId: '',
          position: currency.balance.toDecimal(),
          tokenPrice: Dec(1),
          marketValue: currency.balance.toDecimal(),
          showActions: isPortfolioPage,
          connectedNetwork: wallet.connectedNetworkName,
        }
      }) || []),
    ...((wallet.connectedNetwork === 'centrifuge' && showActions) || centBalances?.native.balance.gtn(0)
      ? [
          {
            currency: {
              ...centBalances?.native.currency,
              symbol: centBalances?.native.currency.symbol ?? 'CFG',
              name: centBalances?.native.currency.symbol ?? 'CFG',
              decimals: centBalances?.native.currency.decimals ?? 18,
              key: 'centrifuge',
              isPoolCurrency: false,
              isPermissioned: false,
              displayName: centBalances?.native.currency.symbol ?? 'CFG',
            },
            poolId: '',
            trancheId: '',
            position: centBalances?.native.balance.toDecimal().sub(centBalances.native.locked.toDecimal()) || Dec(0),
            tokenPrice: CFGPrice ? Dec(CFGPrice) : Dec(0),
            marketValue: CFGPrice ? centBalances?.native.balance.toDecimal().mul(CFGPrice) ?? Dec(0) : Dec(0),
            showActions: isPortfolioPage,
            connectedNetwork: wallet.connectedNetworkName,
          },
        ]
      : []),
  ].filter(Boolean)

  return tokens
}

export function Holdings({
  showActions = true,
  address,
  chainId,
}: {
  showActions?: boolean
  address?: string
  chainId?: number
}) {
  const { search, pathname } = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(search)
  const openSendDrawer = params.get('send')
  const openReceiveDrawer = params.get('receive')
  const openInvestDrawer = params.get('invest')
  const openRedeemDrawer = params.get('redeem')

  const [investPoolId, investTrancheId] = openInvestDrawer?.split('.') || []
  const [redeemPoolId, redeemTrancheId] = openRedeemDrawer?.split('.') || []

  const tokens = useHoldings(address, chainId, showActions)

  return address && tokens.length ? (
    <>
      {investPoolId || redeemPoolId ? (
        <InvestRedeemDrawer
          poolId={investPoolId || redeemPoolId || ''}
          trancheId={investTrancheId || redeemTrancheId || ''}
          open={!!(openRedeemDrawer || openInvestDrawer)}
          onClose={() => navigate(pathname, { replace: true })}
          defaultView={openRedeemDrawer ? 'redeem' : 'invest'}
        />
      ) : null}
      <TransferTokensDrawer
        isOpen={!!(openSendDrawer || openReceiveDrawer)}
        onClose={() => navigate(pathname, { replace: true })}
      />
      <DataTable columns={columns} data={tokens} defaultSortKey="position" />
    </>
  ) : (
    <Shelf borderRadius="4px" backgroundColor="backgroundSecondary" justifyContent="center" p="10px">
      <Text color="textSecondary" variant="body2">
        No holdings displayed yet
      </Text>
    </Shelf>
  )
}

const TokenWithIcon = ({ poolId, currency }: Holding) => {
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
