import { CurrencyBalance, Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { ConnectionGuard, formatBalanceAbbreviated, useGetNetworkName, useWallet } from '@centrifuge/centrifuge-react'
import { Network } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/types'
import { useGetExplorerUrl } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/utils'
import {
  AnchorButton,
  Box,
  Button,
  CurrencyInput,
  Flex,
  IconArrowUpRight,
  IconCheckInCircle,
  IconClock,
  InlineFeedback,
  SelectInner,
  Shelf,
  Stack,
  Tabs,
  TabsItem,
  Text,
  TextWithPlaceholder,
} from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useTheme } from 'styled-components'
import { ethConfig } from '../../config'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { useAddress } from '../../utils/useAddress'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useActiveDomains } from '../../utils/useLiquidityPools'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { positiveNumber } from '../../utils/validation'
import { ButtonGroup } from '../ButtonGroup'
import { useDebugFlags } from '../DebugFlags'
import { LiquidityRewardsContainer } from '../LiquidityRewards/LiquidityRewardsContainer'
import { LiquidityRewardsProvider } from '../LiquidityRewards/LiquidityRewardsProvider'
import { LoadBoundary } from '../LoadBoundary'
import { Transactions } from '../Portfolio/Transactions'
import { Spinner } from '../Spinner'
import { AnchorTextLink } from '../TextLink'
import { InvestRedeemProvider, useInvestRedeem } from './InvestRedeemProvider'

export type InvestRedeemProps = {
  poolId: string
  trancheId: string
} & InputProps

// @ts-ignore
const listFormatter = new Intl.ListFormat('en')

export function InvestRedeem({ poolId, trancheId, ...rest }: InvestRedeemProps) {
  const getNetworkName = useGetNetworkName()
  const { connectedType, isEvmOnSubstrate } = useWallet()

  const isLiquidityPools = !poolId.startsWith('0x') && connectedType === 'evm' && !isEvmOnSubstrate
  const isTinlakePool = poolId.startsWith('0x')

  const { data: domains } = useActiveDomains(poolId, isLiquidityPools)

  const networks: Network[] = poolId.startsWith('0x') ? [ethConfig.network === 'goerli' ? 5 : 1] : ['centrifuge']
  if (domains) {
    networks.push(...domains.map((d) => d.chainId))
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
            <Header />
            <InvestRedeemInput {...rest} />
            {!isTinlakePool && (connectedType === 'substrate' || isEvmOnSubstrate) && <LiquidityRewardsContainer />}
            <Footer />
          </InvestRedeemProvider>
        </LiquidityRewardsProvider>
      </ConnectionGuard>
    </LoadBoundary>
  )
}

// function min(...nums: Decimal[]) {
//   return nums.reduce((a, b) => (a.greaterThan(b) ? b : a))
// }

function inputToNumber(num: number | Decimal | '') {
  return num instanceof Decimal ? num.toNumber() : num || 0
}
function inputToDecimal(num: number | Decimal | string) {
  return Dec(num || 0)
}

function validateNumberInput(value: number | string | Decimal, min: number | Decimal, max?: number | Decimal) {
  if (value === '' || value == null) {
    return 'Not a valid number'
  }
  if (max && Dec(value).greaterThan(Dec(max))) {
    return 'Value too large'
  }
  if (Dec(value).lessThan(Dec(min))) {
    return 'Value too small'
  }
}

function EpochBusy({ busy }: { busy?: boolean }) {
  return busy ? (
    <InlineFeedback>
      The pool is busy calculating epoch orders.
      <br />
      Try again later.
    </InlineFeedback>
  ) : null
}

type InputProps = {
  defaultView?: 'invest' | 'redeem'
}

function InvestRedeemInput({ defaultView: defaultViewProp }: InputProps) {
  const { state } = useInvestRedeem()
  const pool = usePool(state.poolId)
  let defaultView = defaultViewProp
  if (state.order && !defaultView) {
    if (!state.order.remainingInvestCurrency.isZero()) defaultView = 'invest'
    if (!state.order.remainingRedeemToken.isZero()) defaultView = 'redeem'
  }
  const [view, setView] = React.useState<'invest' | 'redeem'>(defaultView ?? 'invest')
  const theme = useTheme()

  const { data: metadata } = usePoolMetadata(pool)

  return (
    <Stack>
      <Flex
        style={{
          boxShadow: `inset 0 -2px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <Tabs
          selectedIndex={view === 'invest' ? 0 : 1}
          onChange={(index) => setView(index === 0 ? 'invest' : 'redeem')}
        >
          <TabsItem>Invest</TabsItem>
          <TabsItem>Redeem</TabsItem>
        </Tabs>
      </Flex>
      <Box p={2} backgroundColor="backgroundTertiary">
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
                  {metadata?.pool?.issuer?.name} tokens are available to U.S. and Non-U.S. persons. U.S. persons must be
                  verified "accredited investors".{' '}
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

function Header() {
  const { state } = useInvestRedeem()
  const { connectedType } = useWallet()

  return (
    <Stack gap={2}>
      <Text variant="heading2" textAlign="center">
        {state.trancheCurrency?.symbol} investment overview
      </Text>
      {connectedType && (
        <Shelf
          justifyContent="space-between"
          borderWidth="1px 0"
          borderColor="borderSecondary"
          borderStyle="solid"
          py={1}
        >
          <Stack>
            <TextWithPlaceholder variant="body3" color="textSecondary">
              Position
            </TextWithPlaceholder>
            <TextWithPlaceholder variant="heading6" isLoading={state.isDataLoading} width={12} variance={0}>
              {formatBalance(state.investmentValue, state.poolCurrency?.symbol, 2, 0)}
            </TextWithPlaceholder>
          </Stack>
          {/*
          <Stack>
            <TextWithPlaceholder variant="body3" color="textSecondary">
              Cost basis
            </TextWithPlaceholder>
            <TextWithPlaceholder variant="heading6" isLoading={state.isDataLoading} width={12} variance={0}>
              -
            </TextWithPlaceholder>
          </Stack>

          <Stack>
            <TextWithPlaceholder variant="body3" color="textSecondary">
              Profit
            </TextWithPlaceholder>
            <TextWithPlaceholder variant="heading6" isLoading={state.isDataLoading} width={12} variance={0}>
              -
            </TextWithPlaceholder>
          </Stack> */}
        </Shelf>
      )}
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
          <Text variant="heading4">Transaction history</Text>
          <Transactions onlyMostRecent narrow address={state.actingAddress} trancheId={state.trancheId} />
        </Stack>
      )}
    </>
  )
}

function OnboardingButton() {
  const { showNetworks, connectedType } = useWallet()
  const { state } = useInvestRedeem()
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const isTinlakePool = pool.id.startsWith('0x')
  const history = useHistory()

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
      history.push(`/onboarding?poolId=${state.poolId}&trancheId=${state.trancheId}`)
    }
  }

  return (
    <Button disabled={investStatus === 'closed'} onClick={handleClick}>
      {getOnboardingButtonText()}
    </Button>
  )
}

type InvestValues = {
  amount: number | ''
}

type InvestFormProps = {
  autoFocus?: boolean
  investLabel?: string
}

function InvestForm({ autoFocus, investLabel = 'Invest' }: InvestFormProps) {
  const { state, actions, hooks } = useInvestRedeem()
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)
  const [claimDismissed, setClaimDismissed] = React.useState(false)
  const { allowInvestBelowMin } = useDebugFlags()
  const pool = usePool(state.poolId)

  hooks.useActionSucceeded((action) => {
    if (action === 'approvePoolCurrency') {
      form.submitForm()
    } else {
      form.resetForm()
      setChangeOrderFormShown(false)
    }
  })

  const pendingInvest = state.order?.remainingInvestCurrency ?? Dec(0)
  const hasPendingOrder = !pendingInvest.isZero()

  const loadingMessage = state.pendingTransaction?.status === 'pending' ? 'Pending...' : 'Signing...'

  const form = useFormik<{ amount: number | Decimal }>({
    initialValues: {
      amount: 0,
    },
    onSubmit: (values, fromActions) => {
      const amount = CurrencyBalance.fromFloat(values.amount, state.poolCurrency!.decimals)
      actions.invest(amount)
      fromActions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}
      if (validateNumberInput(values.amount, 0, state.poolCurrencyBalanceWithPending)) {
        errors.amount = validateNumberInput(values.amount, 0, state.poolCurrencyBalanceWithPending)
      } else if (hasPendingOrder && Dec(values.amount || 0).eq(pendingInvest)) {
        errors.amount = 'Equals current order'
      } else if (
        !allowInvestBelowMin &&
        state.isFirstInvestment &&
        Dec(values.amount || 0).lt(state.minInitialInvestment)
      ) {
        errors.amount = 'Investment amount too low'
      } else if (Dec(values.amount || 0).lt(state.minOrder)) {
        errors.amount = 'Order amount too low'
      }

      return errors
    },
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  const nativeBalanceTooLow = state.nativeBalance.eq(0)

  const inputAmountCoveredByCapacity = inputToDecimal(form.values.amount).lessThanOrEqualTo(state.capacity ?? 0)

  const isPending =
    !!state.pendingTransaction && ['creating', 'unconfirmed', 'pending'].includes(state.pendingTransaction?.status)
  const isInvesting = state.pendingAction === 'invest' && isPending
  const isCancelling = state.pendingAction === 'cancelInvest' && isPending
  const isApproving = state.pendingAction === 'approvePoolCurrency' && isPending

  function renderInput(
    cancelCb?: () => void,
    preSubmitAction?: { onClick: () => void; loading?: boolean; label?: string }
  ) {
    return (
      <Stack gap={2}>
        <EpochBusy busy={state.isPoolBusy} />
        {state.statusMessage && <InlineFeedback>{state.statusMessage}</InlineFeedback>}
        {nativeBalanceTooLow && (
          <InlineFeedback>
            {state.nativeCurrency && `${state.nativeCurrency.symbol} balance is too low.`}
          </InlineFeedback>
        )}
        <Field name="amount" validate={positiveNumber()}>
          {({ field, meta }: FieldProps) => {
            return (
              <CurrencyInput
                {...field}
                onChange={(value) => form.setFieldValue('amount', value)}
                errorMessage={meta.touched && (field.value !== 0 || form.submitCount > 0) ? meta.error : undefined}
                label={`Amount ${
                  state.isFirstInvestment
                    ? `(min: ${formatBalance(state.minInitialInvestment, state.poolCurrency?.symbol)})`
                    : ''
                }`}
                disabled={isInvesting}
                currency={
                  state?.poolCurrencies.length > 1 ? (
                    <SelectInner
                      {...field}
                      onChange={(e) => actions.selectPoolCurrency(e.target.value)}
                      options={state?.poolCurrencies.map((c) => ({ value: c.symbol, label: c.symbol }))}
                    />
                  ) : (
                    state.poolCurrency?.symbol
                  )
                }
                secondaryLabel={
                  state.poolCurrencyBalance &&
                  state.poolCurrency &&
                  `${formatBalance(state.poolCurrencyBalanceWithPending, state.poolCurrency.symbol, 2)} balance`
                }
                onSetMax={() => form.setFieldValue('amount', state.poolCurrencyBalanceWithPending)}
                autoFocus={autoFocus}
              />
            )
          }}
        </Field>
        {inputToNumber(form.values.amount) > 0 && inputAmountCoveredByCapacity && (
          <Text variant="label2" color="statusOk">
            Full amount covered by investment capacity ✓
          </Text>
        )}

        {inputToNumber(form.values.amount) > 0 && (
          <Box p={2} backgroundColor="secondarySelectedBackground" borderRadius="input">
            <Text variant="body3">
              Token amount{' '}
              <TextWithPlaceholder isLoading={state.isDataLoading} fontWeight={600} width={12} variance={0}>
                {!state.tokenPrice.isZero() &&
                  `~${formatBalance(Dec(form.values.amount).div(state.tokenPrice), state.trancheCurrency?.symbol)}`}
              </TextWithPlaceholder>
            </Text>
          </Box>
        )}
        {state.isFirstInvestment && (
          <InlineFeedback>
            All orders are being collected and will be executed by the issuer of the pool.
          </InlineFeedback>
        )}
        <ButtonGroup>
          {preSubmitAction ? (
            <Button {...preSubmitAction}>{preSubmitAction.label ?? investLabel}</Button>
          ) : (
            <Button
              type="submit"
              loading={isInvesting}
              loadingMessage={loadingMessage}
              disabled={state.isPoolBusy || nativeBalanceTooLow}
            >
              {changeOrderFormShown ? 'Change order' : investLabel}
            </Button>
          )}
          {cancelCb && (
            <Button variant="secondary" onClick={cancelCb}>
              Cancel
            </Button>
          )}
        </ButtonGroup>
      </Stack>
    )
  }
  return (
    <FormikProvider value={form}>
      <Form noValidate ref={formRef}>
        {state.collectType && !claimDismissed ? (
          <Claim type="invest" onDismiss={() => setClaimDismissed(true)} />
        ) : changeOrderFormShown ? (
          state.needsPoolCurrencyApproval(inputToNumber(form.values.amount)) ? (
            renderInput(() => setChangeOrderFormShown(false), {
              onClick: () =>
                actions.approvePoolCurrency(
                  CurrencyBalance.fromFloat(form.values.amount, state.poolCurrency!.decimals)
                ),
              loading: isApproving,
            })
          ) : (
            renderInput(() => setChangeOrderFormShown(false))
          )
        ) : hasPendingOrder ? (
          <Stack gap={2}>
            {state.statusMessage && <InlineFeedback>{state.statusMessage}</InlineFeedback>}
            <PendingOrder
              type="invest"
              pool={pool}
              amount={pendingInvest}
              onCancelOrder={() => actions.cancelInvest()}
              isCancelling={isCancelling}
              onChangeOrder={() => {
                form.resetForm()
                form.setFieldValue('amount', pendingInvest, false)
                setChangeOrderFormShown(true)
              }}
            />
          </Stack>
        ) : state.needsPoolCurrencyApproval(inputToNumber(form.values.amount)) ? (
          renderInput(undefined, {
            onClick: () =>
              actions.approvePoolCurrency(CurrencyBalance.fromFloat(form.values.amount, state.poolCurrency!.decimals)),
            loading: isApproving,
          })
        ) : (
          renderInput(undefined)
        )}
      </Form>
    </FormikProvider>
  )
}

type RedeemFormProps = {
  autoFocus?: boolean
}

function RedeemForm({ autoFocus }: RedeemFormProps) {
  const { state, actions, hooks } = useInvestRedeem()
  const pool = usePool(state.poolId) as Pool
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)
  const [claimDismissed, setClaimDismissed] = React.useState(false)

  const pendingRedeem = state.order?.remainingRedeemToken ?? Dec(0)

  const maxRedeemTokens = state.trancheBalanceWithPending
  const maxRedeemCurrency = maxRedeemTokens.mul(state.tokenPrice)
  const tokenSymbol = state.trancheCurrency?.symbol

  hooks.useActionSucceeded((action) => {
    if (action === 'approveTrancheToken') {
      form.submitForm()
    } else {
      form.resetForm()
      setChangeOrderFormShown(false)
    }
  })

  // const availableReserve = Dec(pool.reserve.available ?? '0').div('1e18')
  // const redeemCapacity = min(availableReserve.div(price)) // TODO: check risk buffer
  // const inputAmountCoveredByCapacity = inputToDecimal(form.values.amount).lessThanOrEqualTo(redeemCapacity)
  const hasPendingOrder = !pendingRedeem.isZero()

  const loadingMessage = state.pendingTransaction?.status === 'pending' ? 'Pending...' : 'Signing...'

  /**
   * The form field for amount is in the pool currency, but redeem orders are placed by passing an amount of tranche tokens to redeem.
   * When submitting the form, the amount gets divided by the price to get the amount of tranche tokens to redeem.
   * When clicking on the "max" button in the input box, we set the amount to a Decimal representing the number of tranche tokens the user has.
   * This to avoid possibly losing precision if we were to convert it to the pool currency and then back again when submitting the form.
   */
  const form = useFormik<{ amount: number | '' | Decimal }>({
    initialValues: {
      amount: '',
    },
    onSubmit: (values, formActions) => {
      const amountTokens =
        values.amount instanceof Decimal ? values.amount : Dec(values.amount || 0).div(state.tokenPrice)
      actions.redeem(TokenBalance.fromFloat(amountTokens, state.poolCurrency?.decimals ?? 18))
      formActions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}
      const amountTokens =
        values.amount instanceof Decimal ? values.amount : Dec(values.amount || 0).div(state.tokenPrice)
      if (validateNumberInput(amountTokens, 0, maxRedeemTokens)) {
        errors.amount = validateNumberInput(amountTokens, 0, maxRedeemTokens)
      } else if (hasPendingOrder && amountTokens.eq(pendingRedeem)) {
        errors.amount = 'Equals current order'
      } else if (Dec(values.amount || 0).lt(state.minOrder)) {
        errors.amount = 'Order amount too low'
      }

      return errors
    },
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  const isPending =
    !!state.pendingTransaction && ['creating', 'unconfirmed', 'pending'].includes(state.pendingTransaction?.status)
  const isRedeeming = state.pendingAction === 'redeem' && isPending
  const isCancelling = state.pendingAction === 'cancelRedeem' && isPending
  const isApproving = state.pendingAction === 'approveTrancheToken' && isPending

  const calculatingOrders = pool.epoch.status !== 'ongoing'

  function renderInput(cancelCb?: () => void, preSubmitAction?: { onClick: () => void; loading?: boolean }) {
    return (
      <Stack gap={2}>
        {state.order && !state.order.payoutCurrencyAmount.isZero() && (
          <SuccessBanner
            title="Redemption successful"
            body={
              <Stack gap={1}>
                <div>
                  Redeemed {state.poolCurrency?.symbol}:{' '}
                  <Text fontWeight="bold">
                    {formatBalance(state.order.payoutCurrencyAmount, state.poolCurrency?.symbol)}
                  </Text>
                </div>
              </Stack>
            }
          />
        )}
        <EpochBusy busy={calculatingOrders} />

        <Field name="amount" validate={positiveNumber()}>
          {({ field, meta }: FieldProps) => (
            <CurrencyInput
              {...field}
              // when the value is a decimal we assume the user clicked the max button
              // it tracks the value in tokens and needs to be multiplied by price to get the value in pool currency
              value={field.value instanceof Decimal ? field.value.mul(state.tokenPrice).toNumber() : field.value}
              errorMessage={meta.touched && (field.value !== 0 || form.submitCount > 0) ? meta.error : undefined}
              label="Amount"
              disabled={isRedeeming}
              onSetMax={() => form.setFieldValue('amount', state.trancheBalanceWithPending)}
              onChange={(value) => form.setFieldValue('amount', value)}
              currency={state.poolCurrency?.symbol}
              secondaryLabel={`${formatBalance(roundDown(maxRedeemCurrency), state.poolCurrency?.symbol, 2)} available`}
              autoFocus={autoFocus}
            />
          )}
        </Field>
        {inputToNumber(form.values.amount) > 0 && (
          <Box p={2} backgroundColor="secondarySelectedBackground" borderRadius="card">
            <Text variant="body3">
              Token amount{' '}
              <Text variant="body3" fontWeight="bold" width={12} variance={0}>
                {!state.tokenPrice.isZero() &&
                  `~${formatBalance(
                    form.values.amount instanceof Decimal
                      ? form.values.amount
                      : Dec(form.values.amount).div(state.tokenPrice),
                    tokenSymbol
                  )}`}
              </Text>
            </Text>
          </Box>
        )}
        <ButtonGroup>
          {preSubmitAction ? (
            <Button {...preSubmitAction}>Redeem</Button>
          ) : (
            <Button type="submit" loading={isRedeeming} loadingMessage={loadingMessage} disabled={calculatingOrders}>
              Redeem
            </Button>
          )}
          {cancelCb && (
            <Button variant="secondary" onClick={cancelCb} disabled={calculatingOrders}>
              Cancel
            </Button>
          )}
        </ButtonGroup>
      </Stack>
    )
  }

  return (
    <FormikProvider value={form}>
      <Form noValidate ref={formRef}>
        {state.collectType && !claimDismissed ? (
          <Claim type="redeem" onDismiss={() => setClaimDismissed(true)} />
        ) : changeOrderFormShown ? (
          state.needsTrancheTokenApproval(inputToNumber(form.values.amount)) ? (
            renderInput(() => setChangeOrderFormShown(false), {
              onClick: () =>
                actions.approveTrancheToken(
                  TokenBalance.fromFloat(form.values.amount, state.trancheCurrency!.decimals)
                ),
              loading: isApproving,
            })
          ) : (
            renderInput(() => setChangeOrderFormShown(false))
          )
        ) : hasPendingOrder ? (
          <PendingOrder
            type="redeem"
            pool={pool}
            amount={pendingRedeem}
            onCancelOrder={() => actions.cancelRedeem()}
            isCancelling={isCancelling}
            onChangeOrder={() => {
              form.resetForm()
              form.setFieldValue('amount', pendingRedeem, false)
              setChangeOrderFormShown(true)
            }}
          />
        ) : state.needsTrancheTokenApproval(inputToNumber(form.values.amount)) ? (
          renderInput(undefined, {
            onClick: () =>
              actions.approveTrancheToken(TokenBalance.fromFloat(form.values.amount, state.trancheCurrency!.decimals)),
            loading: isApproving,
          })
        ) : (
          renderInput(undefined)
        )}
      </Form>
    </FormikProvider>
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

function SuccessBanner({ title, body }: { title: string; body?: React.ReactNode }) {
  return (
    <Stack gap={1}>
      <Shelf gap={1} color="statusOk">
        <IconCheckInCircle size="iconSmall" />
        <Text variant="body2" fontWeight={600} color="inherit">
          {title}
        </Text>
      </Shelf>
      {body && (
        <Box p={2} backgroundColor="secondarySelectedBackground" borderRadius="card">
          <Text variant="body3">{body}</Text>
        </Box>
      )}
    </Stack>
  )
}

function PendingOrder({
  type,
  amount,
  pool,
  onCancelOrder,
  isCancelling,
  onChangeOrder,
}: {
  type: 'invest' | 'redeem'
  amount: Decimal
  pool: Pool | TinlakePool
  onCancelOrder: () => void
  isCancelling: boolean
  onChangeOrder: () => void
}) {
  const { state } = useInvestRedeem()
  const calculatingOrders = pool.epoch.status !== 'ongoing'
  return (
    <Stack gap={2}>
      <EpochBusy busy={calculatingOrders} />
      <Stack gap={1}>
        <Shelf gap={1}>
          <IconClock size="iconSmall" />
          <Text variant="heading4">Open order</Text>
        </Shelf>
        <Stack
          p={2}
          gap={1}
          backgroundColor="secondarySelectedBackground"
          borderTopLeftRadius="input"
          borderTopRightRadius="input"
        >
          {type === 'invest' ? (
            <>
              <Text variant="body3">
                Invested {state.poolCurrency?.symbol} value{' '}
                <Text fontWeight={600}>{formatBalance(amount, state.poolCurrency?.symbol)}</Text>
              </Text>
              <Text variant="body3">
                Token amount ~
                <Text fontWeight={600}>
                  {formatBalance(amount.div(state.tokenPrice), state.trancheCurrency?.symbol)}
                </Text>
              </Text>
            </>
          ) : (
            <>
              <Text variant="body3">
                Token amount <Text fontWeight={600}>{formatBalance(amount, state.trancheCurrency?.symbol)}</Text>
              </Text>
              <Text variant="body3">
                {state.poolCurrency?.symbol} value ~
                <Text fontWeight={600}>{formatBalance(amount.mul(state.tokenPrice), state.poolCurrency?.symbol)}</Text>
              </Text>
            </>
          )}
          <Text variant="body3">
            All orders are being collected and will be executed by the issuer of the pool.{' '}
            <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink>
          </Text>
        </Stack>
      </Stack>
      <ButtonGroup>
        {state.canChangeOrder && (
          <Button onClick={onChangeOrder} disabled={isCancelling || calculatingOrders}>
            Change order
          </Button>
        )}
        {state.canCancelOrder && (
          <Button onClick={onCancelOrder} loading={isCancelling} disabled={calculatingOrders} variant="secondary">
            Cancel
          </Button>
        )}
      </ButtonGroup>
    </Stack>
  )
}

function Claim({ type, onDismiss }: { type: 'invest' | 'redeem'; onDismiss?: () => void }) {
  const { state, actions } = useInvestRedeem()
  if (!state.order || !state.collectType) return null

  const isPending =
    !!state.pendingTransaction && ['creating', 'unconfirmed', 'pending'].includes(state.pendingTransaction?.status)
  const isCollecting = state.pendingAction === 'collect' && isPending
  return (
    <Stack gap={2}>
      {state.collectType === 'invest' ? (
        <SuccessBanner
          title="Investment successful"
          body={
            <Stack gap={1}>
              <div>
                Invested {state.poolCurrency?.symbol} value{' '}
                <Text fontWeight="bold">
                  {formatBalance(state.order.payoutTokenAmount.mul(state.tokenPrice), state.poolCurrency?.symbol)}
                </Text>
              </div>
              <div>
                Token amount{' '}
                <Text fontWeight="bold">
                  {formatBalance(state.order.payoutTokenAmount, state.trancheCurrency?.symbol)}
                </Text>
              </div>
            </Stack>
          }
        />
      ) : (
        <SuccessBanner
          title="Redemption successful"
          body={
            <Stack gap={1}>
              <div>
                Redeemed {state.poolCurrency?.symbol} amount{' '}
                <Text fontWeight="bold">
                  {formatBalance(state.order.payoutCurrencyAmount, state.poolCurrency?.symbol)}
                </Text>
              </div>
            </Stack>
          }
        />
      )}
      {state.needsToCollectBeforeOrder && <InlineFeedback>Claim tokens before placing another order</InlineFeedback>}
      <ButtonGroup>
        <Button onClick={actions.collect} loading={isCollecting}>
          Claim{' '}
          {formatBalanceAbbreviated(
            state.collectAmount,
            state.collectType === 'invest' ? state.trancheCurrency?.symbol : state.poolCurrency?.symbol
          )}
        </Button>
        {!state.needsToCollectBeforeOrder && (
          <Button variant="secondary" onClick={onDismiss}>
            {type === 'invest' ? 'Invest more' : 'Redeem'}
          </Button>
        )}
      </ButtonGroup>
    </Stack>
  )
}
