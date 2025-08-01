import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { ConnectionGuard, useGetNetworkName, useWallet } from '@centrifuge/centrifuge-react'
import { Network } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/types'
import { useGetExplorerUrl } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/utils'
import {
  AnchorButton,
  Box,
  Button,
  Flex,
  IconArrowUpRight,
  Shelf,
  Stack,
  Tabs,
  TabsItem,
  Text,
  TextWithPlaceholder,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatBalance } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { useGmp } from '../../utils/useGmp'
import { useActiveDomains } from '../../utils/useLiquidityPools'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { LiquidityRewardsContainer } from '../LiquidityRewards/LiquidityRewardsContainer'
import { LiquidityRewardsProvider } from '../LiquidityRewards/LiquidityRewardsProvider'
import { LoadBoundary } from '../LoadBoundary'
import { PoolMetaDataPartial } from '../PoolList'
import { Transactions } from '../Portfolio/Transactions'
import { Spinner } from '../Spinner'
import { AnchorTextLink } from '../TextLink'
import { InvestForm } from './InvestForm'
import { InvestRedeemProvider, useInvestRedeem } from './InvestRedeemProvider'
import { RedeemForm } from './RedeemForm'

export type InvestRedeemProps = {
  poolId: string
  trancheId: string
  metadata?: PoolMetaDataPartial
} & InputProps

type HeaderProps = {
  sumUnrealizedProfitAtMarketPrice?: CurrencyBalance
  sumRealizedProfitFifoByPeriod?: CurrencyBalance
} & InputProps

type InputProps = {
  defaultView?: 'invest' | 'redeem'
}

// @ts-ignore
const listFormatter = new Intl.ListFormat('en')

export function InvestRedeem({ poolId, trancheId, ...rest }: InvestRedeemProps) {
  const getNetworkName = useGetNetworkName()
  const { connectedType, isEvmOnSubstrate } = useWallet()

  const isLiquidityPools = !poolId.startsWith('0x') && connectedType === 'evm' && !isEvmOnSubstrate
  const isTinlakePool = poolId.startsWith('0x')

  const { data: domains } = useActiveDomains(poolId, isLiquidityPools)
  const domainsWithAtLeastOneLP =
    domains && domains.filter((domain) => Object.values(domain.liquidityPools[trancheId] ?? {}).some((p) => !!p))

  const networks: Network[] = poolId.startsWith('0x') ? [1] : ['centrifuge']
  if (domainsWithAtLeastOneLP) {
    networks.push(...domainsWithAtLeastOneLP.map((d) => d.chainId))
  }

  return (
    <LoadBoundary>
      <ConnectionGuard
        networks={networks}
        body={
          connectedType
            ? `This pool is deployed on the ${listFormatter.format(networks.map(getNetworkName))} ${
                networks.length > 1 ? 'networks' : 'network'
              }. To be able to invest and redeem you need to switch the network.`
            : 'Connect to get started'
        }
        showConnect
      >
        <LiquidityRewardsProvider poolId={poolId} trancheId={trancheId}>
          <InvestRedeemProvider poolId={poolId} trancheId={trancheId}>
            <Header {...rest} />
            <InvestRedeemInput {...rest} />
            {!isTinlakePool && (connectedType === 'substrate' || isEvmOnSubstrate) && <LiquidityRewardsContainer />}
            <Footer />
          </InvestRedeemProvider>
        </LiquidityRewardsProvider>
      </ConnectionGuard>
    </LoadBoundary>
  )
}

function InvestRedeemInput({ defaultView: defaultViewProp }: InputProps) {
  const { state } = useInvestRedeem()
  const { render: renderGmp } = useGmp()
  const pool = usePool(state.poolId)
  let defaultView = defaultViewProp
  if (state.order && !defaultView) {
    if (!state.order.remainingInvestCurrency.isZero()) defaultView = 'invest'
    if (!state.order.remainingRedeemToken.isZero()) defaultView = 'redeem'
  }
  const [view, setView] = React.useState<'invest' | 'redeem'>(defaultView ?? 'invest')

  const { data: metadata } = usePoolMetadata(pool)

  return (
    <Stack gap={2}>
      {renderGmp(state.poolId, state.trancheId)}
      <Flex>
        <Tabs
          selectedIndex={view === 'invest' ? 0 : 1}
          onChange={(index) => setView(index === 0 ? 'invest' : 'redeem')}
        >
          <TabsItem ariaLabel="Go to invest tab">Invest</TabsItem>
          <TabsItem ariaLabel="Go to redeem tab">Redeem</TabsItem>
        </Tabs>
      </Flex>
      <Box p={2} borderWidth="1px" borderColor="borderPrimary" borderStyle="solid" borderRadius="10px">
        {state.isDataLoading ? (
          <Spinner />
        ) : state.isAllowedToInvest ? (
          view === 'invest' ? (
            <InvestForm autoFocus />
          ) : (
            <RedeemForm autoFocus />
          )
        ) : (
          // TODO: Show whether onboarding is in progress
          <Stack gap={2}>
            <Text variant="body3">
              {metadata?.onboarding?.kybRestrictedCountries?.includes('us') ||
              metadata?.onboarding?.kybRestrictedCountries?.includes('us') ? (
                `${state.trancheCurrency?.name} is only available to Non-U.S. persons.`
              ) : (
                <>
                  {metadata?.pool?.issuer?.name} tokens are available only for Non-U.S. Professional Investors.{' '}
                  <AnchorTextLink href="https://docs.centrifuge.io/use/onboarding/#onboarding-as-an-us-investor">
                    Learn more
                  </AnchorTextLink>
                </>
              )}
            </Text>
            <Stack px={1}>
              <OnboardingButton />
            </Stack>
          </Stack>
        )}
      </Box>
    </Stack>
  )
}

function Header({ sumRealizedProfitFifoByPeriod, sumUnrealizedProfitAtMarketPrice }: HeaderProps) {
  const { state } = useInvestRedeem()
  const { connectedType } = useWallet()
  return (
    <Stack gap={2}>
      <Text variant="heading2">{state.trancheCurrency?.symbol} investment overview</Text>
      {connectedType && (
        <Stack>
          <TextWithPlaceholder variant="body3" color="textSecondary">
            Investment position
          </TextWithPlaceholder>
          <Shelf gap="3px">
            <TextWithPlaceholder
              variant="heading2"
              fontWeight="bold"
              isLoading={state.isDataLoading}
              width={12}
              variance={0}
            >
              {formatBalance(state.investmentValue, undefined, 2, 0)}
            </TextWithPlaceholder>
            <TextWithPlaceholder variant="heading2" isLoading={state.isDataLoading} width={12} variance={0}>
              {state.poolCurrency?.displayName}
            </TextWithPlaceholder>
          </Shelf>
        </Stack>
      )}
      <Box display="flex">
        <Stack>
          <TextWithPlaceholder variant="body3" color="textSecondary">
            Realized P&L
          </TextWithPlaceholder>
          <Shelf gap={'3px'}>
            <TextWithPlaceholder
              variant="heading2"
              fontWeight="bold"
              isLoading={state.isDataLoading}
              width={12}
              variance={0}
            >
              {formatBalance(sumRealizedProfitFifoByPeriod ?? 0, undefined, 2, 0)}
            </TextWithPlaceholder>
            <TextWithPlaceholder variant="heading2" isLoading={state.isDataLoading} width={12} variance={0}>
              {state.poolCurrency?.displayName}
            </TextWithPlaceholder>
          </Shelf>
        </Stack>
        <Stack marginLeft="20px">
          <TextWithPlaceholder variant="body3" color="textSecondary">
            Unrealized P&L
          </TextWithPlaceholder>
          <Shelf gap="3px">
            <TextWithPlaceholder
              variant="heading2"
              fontWeight="bold"
              isLoading={state.isDataLoading}
              width={12}
              variance={0}
            >
              {formatBalance(sumUnrealizedProfitAtMarketPrice ?? 0, undefined, 2, 0)}
            </TextWithPlaceholder>
            <TextWithPlaceholder variant="heading2" isLoading={state.isDataLoading} width={12} variance={0}>
              {state.poolCurrency?.displayName}
            </TextWithPlaceholder>
          </Shelf>
        </Stack>
      </Box>
    </Stack>
  )
}

function Footer() {
  const { state } = useInvestRedeem()
  const { connectedType } = useWallet()

  return (
    <>
      {state.actingAddress && connectedType === 'substrate' && (
        <Stack gap={2}>
          <Text variant="heading6" color="textPrimary" fontWeight={600}>
            Transaction history
          </Text>
          <Transactions onlyMostRecent narrow address={state.actingAddress} trancheId={state.trancheId} />
        </Stack>
      )}
    </>
  )
}

function OnboardingButton() {
  const { showNetworks, connectedType } = useWallet()
  const { state } = useInvestRedeem()
  const pool = usePool(state.poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const isTinlakePool = pool.id.startsWith('0x')
  const navigate = useNavigate()

  const trancheName = state.trancheId.split('-')[1] === '0' ? 'junior' : 'senior'
  const centPoolInvestStatus = metadata?.onboarding?.tranches?.[state?.trancheId]?.openForOnboarding ? 'open' : 'closed'
  const investStatus = isTinlakePool ? metadata?.pool?.newInvestmentsStatus?.[trancheName] : centPoolInvestStatus

  const getOnboardingButtonText = () => {
    if (investStatus === 'closed') {
      return `${state.trancheCurrency?.symbol ?? 'token'} onboarding closed`
    }

    if (connectedType) {
      if (investStatus === 'request') {
        return 'Contact issuer'
      }

      if (investStatus === 'open' || !isTinlakePool) {
        return `Onboard to ${state.trancheCurrency?.symbol ?? 'token'}`
      }
    } else {
      return 'Connect to invest'
    }
  }

  const handleClick = () => {
    if (!connectedType) {
      showNetworks()
    } else if (investStatus === 'request') {
      window.open(`mailto:${metadata?.pool?.issuer.email}?subject=New%20Investment%20Inquiry`)
    } else if (metadata?.onboarding?.externalOnboardingUrl) {
      window.open(metadata.onboarding.externalOnboardingUrl)
    } else {
      navigate(`/onboarding?poolId=${state.poolId}&trancheId=${state.trancheId}`)
    }
  }

  return (
    <Button disabled={investStatus === 'closed'} onClick={handleClick}>
      {getOnboardingButtonText()}
    </Button>
  )
}

export function TransactionsLink() {
  const address = useAddress()
  const explorer = useGetExplorerUrl(useWallet().connectedNetwork!)
  const url = explorer.address(address!)
  return url ? (
    <Box alignSelf="flex-end">
      <AnchorButton
        variant="tertiary"
        iconRight={IconArrowUpRight}
        href={explorer.address(address!)}
        target="_blank"
        small
      >
        Transactions
      </AnchorButton>
    </Box>
  ) : null
}
