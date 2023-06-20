import { useWallet } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Select,
  Stack,
  Text,
  TextWithPlaceholder,
  Thumbnail,
} from '@centrifuge/fabric'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { Spinner } from '../Spinner'
import { AnchorTextLink } from '../TextLink'
import { EpochBusy } from './EpochBusy'
import { InvestForm } from './InvestForm'
import { useInvestRedeem } from './InvestRedeemProvider'
import { LiquidityRewards } from './LiquidityRewards'
import { OnboardingButton } from './OnboardingButton'
import { RedeemForm } from './RedeemForm'
import { SuccessBanner } from './SuccessBanner'
import { TransactionsLink } from './TransactionsLink'
import { InvestRedeemProps } from './types'
import { useAllowedTranches } from './utils'

type InnerProps = InvestRedeemProps & {
  poolId: string
  trancheId: string
  view: 'invest' | 'redeem' | 'start'
  setView: React.Dispatch<'invest' | 'redeem' | 'start'>
  setTrancheId: React.Dispatch<string>
}

export function InvestRedeemInner({ view, setView, setTrancheId, networks }: InnerProps) {
  const { state } = useInvestRedeem()
  const pool = usePool(state.poolId)
  const allowedTranches = useAllowedTranches(state.poolId)

  const { data: metadata } = usePoolMetadata(pool)
  const { connectedType } = useWallet()

  let actualView = view
  if (state.order) {
    if (!state.order.remainingInvestCurrency.isZero()) actualView = 'invest'
    if (!state.order.remainingRedeemToken.isZero()) actualView = 'redeem'
  }

  const pendingRedeem = state.order?.remainingRedeemToken ?? Dec(0)
  const canOnlyInvest =
    state.order?.payoutTokenAmount.isZero() && state.trancheBalanceWithPending.isZero() && pendingRedeem.isZero()

  // console.log('pendingRedeem', pendingRedeem.toString())
  // console.log('canOnlyInvest', canOnlyInvest)
  // console.log('payoutTokenAmount', state?.order?.payoutTokenAmount.toString())
  // console.log('trancheBalanceWithPending', state?.trancheBalanceWithPending.toString())
  // console.log('-----------')

  if (allowedTranches.length) {
    return (
      <Stack as={Card} gap={2} p={2}>
        <Stack alignItems="center">
          <Box pb={1}>
            <Thumbnail type="token" size="large" label={state.trancheCurrency?.symbol ?? ''} />
          </Box>
          {connectedType && (
            <>
              <TextWithPlaceholder variant="heading3" isLoading={state.isDataLoading}>
                {formatBalance(state.investmentValue, state.poolCurrency?.symbol)}
              </TextWithPlaceholder>
              <TextWithPlaceholder variant="body3" isLoading={state.isDataLoading} width={12} variance={0}>
                {formatBalance(state.trancheBalanceWithPending, state.trancheCurrency?.symbol)}
              </TextWithPlaceholder>
            </>
          )}
          <Box bleedX={2} mt={1} alignSelf="stretch">
            <Divider borderColor="borderSecondary" />
          </Box>
        </Stack>

        {allowedTranches.length > 1 && (
          <Select
            name="token"
            placeholder="Select a token"
            options={allowedTranches
              .map((tranche) => ({
                label: tranche.currency.symbol ?? '',
                value: tranche.id,
              }))
              .reverse()}
            value={state.trancheId}
            onChange={(event) => setTrancheId(event.target.value as any)}
          />
        )}

        <LiquidityRewards />

        {connectedType && state.isDataLoading ? (
          <Spinner />
        ) : state.isAllowedToInvest && metadata?.onboarding?.tranches?.[state.trancheId]?.openForOnboarding ? (
          <>
            {canOnlyInvest ? (
              <InvestForm autoFocus investLabel={`Invest in ${state.trancheCurrency?.symbol ?? ''}`} />
            ) : actualView === 'start' ? (
              <>
                {state.order &&
                  (!state.order.payoutTokenAmount.isZero() ? (
                    <SuccessBanner
                      title="Investment successful"
                      body={`${formatBalance(
                        state.order.investCurrency,
                        state.poolCurrency?.symbol
                      )} was successfully invested`}
                    />
                  ) : !state.order.payoutCurrencyAmount.isZero() ? (
                    <SuccessBanner title="Redemption successful" />
                  ) : null)}

                {/* <LiquidityRewards /> */}

                <EpochBusy busy={state.isPoolBusy} />

                <Stack p={1} gap={1}>
                  <Grid gap={1} columns={2} equalColumns>
                    <Button variant="secondary" small onClick={() => setView('redeem')} disabled={state.isPoolBusy}>
                      Redeem
                    </Button>
                    <Button variant="primary" small onClick={() => setView('invest')} disabled={state.isPoolBusy}>
                      Invest more
                    </Button>
                  </Grid>
                  <Box alignSelf="center">
                    <TransactionsLink />
                  </Box>
                </Stack>
              </>
            ) : actualView === 'invest' ? (
              <InvestForm onCancel={() => setView('start')} autoFocus />
            ) : (
              <RedeemForm onCancel={() => setView('start')} autoFocus />
            )}
          </>
        ) : (
          // TODO: Show whether onboarding is in progress
          <Stack gap={2}>
            <Text variant="body3">
              {metadata?.pool?.issuer?.name} tokens are available to U.S. and Non-U.S. persons. U.S. persons must be
              verified “accredited investors”.{' '}
              <AnchorTextLink href="https://docs.centrifuge.io/use/onboarding/#onboarding-as-an-us-investor">
                Learn more
              </AnchorTextLink>
            </Text>
            <Stack px={1}>
              <OnboardingButton networks={networks} />
            </Stack>
          </Stack>
        )}
      </Stack>
    )
  }
  return null
}
