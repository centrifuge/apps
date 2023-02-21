import { CurrencyBalance, Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { ConnectionGuard } from '@centrifuge/centrifuge-react'
import { Network } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/types'
import {
  AnchorButton,
  Box,
  Button,
  Card,
  CurrencyInput,
  Grid,
  IconArrowUpRight,
  IconCheckInCircle,
  IconClock,
  InlineFeedback,
  Select,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
  useControlledState,
} from '@centrifuge/fabric'
import css from '@styled-system/css'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import styled from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { find } from '../../utils/helpers'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { useAddress } from '../../utils/useAddress'
import { useEpochTimeCountdown } from '../../utils/useEpochTimeCountdown'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePermissions } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { positiveNumber } from '../../utils/validation'
import { useDebugFlags } from '../DebugFlags'
import { LoadBoundary } from '../LoadBoundary'
import { Spinner } from '../Spinner'
import { AnchorTextLink } from '../TextLink'
import { InvestRedeemProvider, useInvestRedeem } from './InvestRedeemProvider'

type Props = {
  poolId: string
  trancheId?: string
  defaultTrancheId?: string
  defaultView?: 'invest' | 'redeem'
  view?: 'invest' | 'redeem' | 'start'
  onSetView?: React.Dispatch<'invest' | 'redeem' | 'start'>
  autoFocus?: boolean
  networks?: Network[]
}

export function InvestRedeem({ networks = ['centrifuge'], ...rest }: Props) {
  return (
    <LoadBoundary>
      <ConnectionGuard networks={networks}>
        <InvestRedeemState {...rest} />
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

function InvestRedeemState(props: Props) {
  const { poolId, trancheId: trancheIdProp, defaultTrancheId, view: viewProp, defaultView, onSetView } = props
  const [view, setView] = useControlledState<'start' | 'invest' | 'redeem'>(defaultView ?? 'start', viewProp, onSetView)
  const address = useAddress('substrate')
  const isTinlakePool = poolId.startsWith('0x')
  const permissions = usePermissions(address)
  const pool = usePool(poolId) as Pool
  const allowedTrancheIds = Object.keys(permissions?.pools[poolId]?.tranches ?? {})
  const [trancheId, setTrancheId] = React.useState(
    trancheIdProp ?? defaultTrancheId ?? allowedTrancheIds[0] ?? pool.tranches[0].id
  )

  console.log('seleleletrancheId', trancheId)

  return (
    <InvestRedeemProvider poolId={poolId} trancheId={trancheId}>
      <InvestRedeemInner
        {...props}
        trancheId={trancheId}
        view={view}
        setView={setView}
        setTrancheId={setTrancheId}
        trancheIdControlled={!!trancheIdProp}
        allowedTrancheIds={!isTinlakePool ? allowedTrancheIds : pool.tranches.map((t) => t.id)}
      />
    </InvestRedeemProvider>
  )
}

type InnerProps = {
  poolId: string
  trancheId: string
  view: 'invest' | 'redeem' | 'start'
  setView: React.Dispatch<'invest' | 'redeem' | 'start'>
  setTrancheId: React.Dispatch<string>
  allowedTrancheIds: string[]
  trancheIdControlled: boolean
  autoFocus?: boolean
}

function InvestRedeemInner({
  view,
  setView,
  setTrancheId,
  allowedTrancheIds,
  trancheIdControlled,
  autoFocus,
}: InnerProps) {
  const { state } = useInvestRedeem()
  const pool = usePool(state.poolId)

  let actualView = view
  if (state.order) {
    if (!state.order.remainingInvestCurrency.isZero()) actualView = 'invest'
    if (!state.order.remainingRedeemToken.isZero()) actualView = 'redeem'
  }
  const pendingRedeem = state.order?.remainingRedeemToken ?? Dec(0)

  return (
    <Stack as={Card} gap={2} p={2}>
      <Stack>
        <Shelf justifyContent="space-between">
          <Text variant="heading3">Investment value</Text>
          <TextWithPlaceholder variant="heading3" isLoading={state.isDataLoading}>
            {formatBalance(state.investmentValue, state.poolCurrency?.symbol)}
          </TextWithPlaceholder>
        </Shelf>
        <Shelf justifyContent="space-between">
          <Text variant="label1">Token balance</Text>
          <TextWithPlaceholder variant="label1" isLoading={state.isDataLoading} width={12} variance={0}>
            {formatBalance(state.trancheBalanceWithPending, state.trancheCurrency?.symbol)}
          </TextWithPlaceholder>
        </Shelf>
      </Stack>
      {!trancheIdControlled && allowedTrancheIds.length > 1 && (
        <Select
          name="token"
          placeholder="Select a token"
          options={allowedTrancheIds.map((id) => ({
            label: find(pool.tranches, (t) => t.id === id)?.currency.symbol ?? '',
            value: id,
          }))}
          value={state.trancheId}
          onChange={(event) => setTrancheId(event.target.value as any)}
        />
      )}
      {state.isDataLoading ? (
        <Spinner />
      ) : state.isAllowedToInvest ? (
        <>
          {state.order?.payoutTokenAmount.isZero() &&
          state.trancheBalanceWithPending.isZero() &&
          pendingRedeem.isZero() ? (
            <InvestForm
              autoFocus={autoFocus}
              investLabel={`Invest in ${state.trancheCurrency?.symbol ?? ''}`}
              onCancel={trancheIdControlled ? () => setView('start') : undefined}
            />
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
              <EpochBusy busy={state.isPoolBusy} />
              <Stack p={1} gap={1}>
                <Button variant="secondary" onClick={() => setView('invest')} disabled={state.isPoolBusy}>
                  Invest more
                </Button>
                <Button variant="secondary" onClick={() => setView('redeem')} disabled={state.isPoolBusy}>
                  Redeem
                </Button>
                <TransactionsLink />
              </Stack>
            </>
          ) : actualView === 'invest' ? (
            <InvestForm onCancel={() => setView('start')} autoFocus={autoFocus} />
          ) : (
            <RedeemForm onCancel={() => setView('start')} autoFocus={autoFocus} />
          )}
        </>
      ) : (
        <Text>Not allowed to invest</Text>
      )}
    </Stack>
  )
}

type InvestValues = {
  amount: number | ''
}

type InvestFormProps = {
  onCancel?: () => void
  hasInvestment?: boolean
  autoFocus?: boolean
  investLabel?: string
}

function InvestForm({ onCancel, hasInvestment, autoFocus, investLabel = 'Invest' }: InvestFormProps) {
  const { state, actions, hooks } = useInvestRedeem()
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)
  const { allowInvestBelowMin } = useDebugFlags()
  const pool = usePool(state.poolId)

  // const { execute: getTxInvestFee, txFee: investTxFee } = useTransactionFeeEstimate(
  //   (cent) => cent.pools.updateInvestOrder
  // )
  // React.useEffect(() => {
  //   // submit dummy tx to get tx fee estimate
  //   getTxInvestFee([poolId, trancheId, CurrencyBalance.fromFloat(100, 18)])
  // }, [poolId, trancheId, getTxInvestFee])

  hooks.useActionSucceeded(() => {
    form.resetForm()
    setChangeOrderFormShown(false)
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
      if (validateNumberInput(values.amount, 0, state.poolCUrrencyBalanceWithPending)) {
        errors.amount = validateNumberInput(values.amount, 0, state.poolCUrrencyBalanceWithPending)
      } else if (hasPendingOrder && Dec(values.amount).eq(pendingInvest)) {
        errors.amount = 'Equals current order'
      } else if (!allowInvestBelowMin && state.isFirstInvestment && Dec(values.amount).lt(state.minInitialInvestment)) {
        errors.amount = 'Investment amount too low'
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
  const isCollecting = state.pendingAction === 'collect' && isPending

  function renderInput(cancelCb?: () => void) {
    return (
      <Stack gap={2}>
        <EpochBusy busy={state.isPoolBusy} />
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
                errorMessage={meta.touched ? meta.error : undefined}
                label={`Amount ${
                  state.isFirstInvestment
                    ? `(min: ${formatBalance(state.minInitialInvestment, state.poolCurrency?.symbol)})`
                    : ''
                }`}
                disabled={isInvesting}
                currency={state.poolCurrency?.symbol}
                secondaryLabel={
                  state.poolCurrencyBalance &&
                  state.poolCurrency &&
                  `${formatBalance(state.poolCUrrencyBalanceWithPending, state.poolCurrency.symbol, 2)} balance`
                }
                onSetMax={() => form.setFieldValue('amount', state.poolCUrrencyBalanceWithPending)}
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
        {inputToNumber(form.values.amount) > 0 ? (
          <Stack px={2} gap="4px">
            <Shelf justifyContent="space-between">
              <Text variant="body3">Token amount</Text>
              <TextWithPlaceholder variant="body3" isLoading={state.isDataLoading} width={12} variance={0}>
                {!state.tokenPrice.isZero() &&
                  `~${formatBalance(Dec(form.values.amount).div(state.tokenPrice), state.trancheCurrency?.symbol)}`}
              </TextWithPlaceholder>
            </Shelf>

            {!hasInvestment && (
              <Text variant="body3" color="textSecondary">
                The investment amount will be locked and executed at the end of the current epoch.
              </Text>
            )}
          </Stack>
        ) : null}
        <Stack px={1} gap={1}>
          <Button
            type="submit"
            loading={isInvesting}
            loadingMessage={loadingMessage}
            disabled={state.isPoolBusy || nativeBalanceTooLow}
          >
            {changeOrderFormShown ? 'Change order' : investLabel}
          </Button>
          {cancelCb && (
            <Button variant="secondary" onClick={cancelCb} disabled={state.isPoolBusy || nativeBalanceTooLow}>
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    )
  }

  return (
    <FormikProvider value={form}>
      <Form noValidate ref={formRef}>
        {state.needsToCollectBeforeOrder ? (
          <Stack gap={2}>
            <InlineFeedback>Need to collect before placing another order</InlineFeedback>
            <Stack px={1} gap={1}>
              <Button onClick={actions.collect} loading={isCollecting}>
                Collect
              </Button>
              {onCancel && (
                <Button variant="secondary" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        ) : changeOrderFormShown ? (
          renderInput(() => setChangeOrderFormShown(false))
        ) : hasPendingOrder ? (
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
        ) : state.needsPoolCurrencyApproval ? (
          <Stack px={1} gap={1}>
            <Button onClick={actions.approvePoolCurrency} loading={isApproving}>
              Approve {state.poolCurrency?.symbol}
            </Button>
            {onCancel && (
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Stack>
        ) : (
          renderInput(onCancel)
        )}
      </Form>
    </FormikProvider>
  )
}

type RedeemFormProps = {
  onCancel: () => void
  autoFocus?: boolean
}

function RedeemForm({ onCancel, autoFocus }: RedeemFormProps) {
  const { state, actions, hooks } = useInvestRedeem()
  const pool = usePool(state.poolId) as Pool
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)

  const pendingRedeem = state.order?.remainingRedeemToken ?? Dec(0)

  const maxRedeem = state.trancheBalanceWithPending.mul(state.tokenPrice)
  const tokenSymbol = state.trancheCurrency?.symbol

  hooks.useActionSucceeded(() => {
    form.resetForm()
    setChangeOrderFormShown(false)
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
      const amount = values.amount instanceof Decimal ? values.amount : Dec(values.amount).div(state.tokenPrice)
      actions.redeem(TokenBalance.fromFloat(amount, pool.currency.decimals ?? 18))
      formActions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}
      const amount = values.amount instanceof Decimal ? values.amount : Dec(values.amount).div(state.tokenPrice)
      if (validateNumberInput(amount, 0, maxRedeem)) {
        errors.amount = validateNumberInput(amount, 0, maxRedeem)
      } else if (hasPendingOrder && amount.eq(pendingRedeem)) {
        errors.amount = 'Equals current order'
      }

      return errors
    },
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  const isPending =
    !!state.pendingTransaction && ['creating', 'unconfirmed', 'pending'].includes(state.pendingTransaction?.status)
  const isRedeeming = state.pendingAction === 'invest' && isPending
  const isCancelling = state.pendingAction === 'cancelInvest' && isPending
  const isApproving = state.pendingAction === 'approveTrancheToken' && isPending
  const isCollecting = state.pendingAction === 'collect' && isPending

  const calculatingOrders = pool.epoch.status !== 'ongoing'

  function renderInput(cancelCb?: () => void) {
    return (
      <Stack gap={2}>
        <EpochBusy busy={calculatingOrders} />
        <Field name="amount" validate={positiveNumber()}>
          {({ field, meta }: FieldProps) => (
            <CurrencyInput
              {...field}
              // when the value is a decimal we assume the user clicked the max button
              // it tracks the value in tokens and needs to be multiplied by price to get the value in pool currency
              value={field.value instanceof Decimal ? field.value.mul(state.tokenPrice).toNumber() : field.value}
              errorMessage={meta.touched ? meta.error : undefined}
              label="Amount"
              disabled={isRedeeming}
              onSetMax={() => form.setFieldValue('amount', state.trancheBalanceWithPending)}
              onChange={(value) => form.setFieldValue('amount', value)}
              currency={pool.currency.symbol}
              secondaryLabel={`${formatBalance(roundDown(maxRedeem), pool.currency.symbol, 2)} available`}
              autoFocus={autoFocus}
            />
          )}
        </Field>
        {inputToNumber(form.values.amount) > 0 ? (
          <Stack px={2} gap="4px">
            <Shelf justifyContent="space-between">
              <Text variant="body3">Token amount</Text>
              <Text variant="body3" width={12} variance={0}>
                {!state.tokenPrice.isZero() &&
                  `~${formatBalance(Dec(form.values.amount).div(state.tokenPrice), tokenSymbol)}`}
              </Text>
            </Shelf>
          </Stack>
        ) : null}
        <Stack px={1} gap={1}>
          <Button type="submit" loading={isRedeeming} loadingMessage={loadingMessage} disabled={calculatingOrders}>
            Redeem
          </Button>
          {cancelCb && (
            <Button variant="secondary" onClick={cancelCb} disabled={calculatingOrders}>
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    )
  }

  return (
    <FormikProvider value={form}>
      <Form noValidate ref={formRef}>
        {state.needsToCollectBeforeOrder ? (
          <Stack gap={2}>
            <InlineFeedback>Need to collect before placing another order</InlineFeedback>
            <Stack px={1} gap={1}>
              <Button onClick={actions.collect} loading={isCollecting}>
                Collect
              </Button>
              {onCancel && (
                <Button variant="secondary" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        ) : changeOrderFormShown ? (
          renderInput(() => setChangeOrderFormShown(false))
        ) : hasPendingOrder ? (
          <PendingOrder
            type="redeem"
            pool={pool}
            amount={pendingRedeem.mul(state.tokenPrice)}
            onCancelOrder={() => actions.cancelRedeem()}
            isCancelling={isCancelling}
            onChangeOrder={() => {
              form.resetForm()
              form.setFieldValue('amount', pendingRedeem, false)
              setChangeOrderFormShown(true)
            }}
          />
        ) : state.needsTrancheTokenApproval ? (
          <Stack px={1} gap={1}>
            <Button onClick={actions.approveTrancheToken} loading={isApproving}>
              Approve {state.trancheCurrency?.symbol}
            </Button>
            {onCancel && (
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Stack>
        ) : (
          renderInput(onCancel)
        )}
      </Form>
    </FormikProvider>
  )
}

const TransactionsLink: React.FC = () => {
  const address = useAddress('substrate')
  return (
    <Box alignSelf="flex-end">
      <AnchorButton
        variant="tertiary"
        iconRight={IconArrowUpRight}
        href={`${import.meta.env.REACT_APP_SUBSCAN_URL}/account/${address}`}
        target="_blank"
        small
      >
        Transactions
      </AnchorButton>
    </Box>
  )
}
const SuccessBanner: React.FC<{ title: string; body?: string }> = ({ title, body }) => {
  return (
    <Stack p={2} gap={1} backgroundColor="secondarySelectedBackground" borderRadius="card">
      <Shelf gap={1}>
        <IconCheckInCircle size="iconSmall" />
        <Text variant="body2" fontWeight={600}>
          {title}
        </Text>
      </Shelf>
      {body && <Text variant="body3">{body}</Text>}
    </Stack>
  )
}

const LightButton = styled.button<{ $left?: boolean }>(
  {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 0,
    appearance: 'none',
    height: 36,
    cursor: 'pointer',
  },
  (props) =>
    css({
      color: 'textPrimary',
      borderBottomLeftRadius: props.$left ? 'card' : undefined,
      borderBottomRightRadius: props.$left ? undefined : 'card',
      backgroundColor: 'secondarySelectedBackground',
      '&:hover, &:focus-visible': {
        color: 'textSelected',
      },
      '&:disabled': {
        cursor: 'not-allowed',
      },
    })
)

const PendingOrder: React.FC<{
  type: 'invest' | 'redeem'
  amount: Decimal
  pool: Pool | TinlakePool
  onCancelOrder: () => void
  isCancelling: boolean
  onChangeOrder: () => void
}> = ({ type, amount, pool, onCancelOrder, isCancelling, onChangeOrder }) => {
  const { message: epochTimeRemaining } = useEpochTimeCountdown(pool.id!)
  const calculatingOrders = pool.epoch.status !== 'ongoing'
  return (
    <Stack gap={2}>
      <EpochBusy busy={calculatingOrders} />
      <Stack gap="1px">
        <Stack
          p={2}
          gap={1}
          backgroundColor="secondarySelectedBackground"
          borderTopLeftRadius="card"
          borderTopRightRadius="card"
        >
          <Shelf gap={1}>
            <IconClock size="iconSmall" />
            <Text variant="body2" fontWeight={500}>
              {formatBalance(amount, pool.currency.symbol)} locked
            </Text>
          </Shelf>
          <Text variant="body3">
            Locked {type === 'invest' ? 'investments' : 'redemptions'} are executed at the end of the epoch (
            {(pool.epoch.status === 'ongoing' && epochTimeRemaining) || `0 min remaining`}).{' '}
            <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink>
          </Text>
        </Stack>
        <Grid gap="1px" columns={2} equalColumns>
          <LightButton type="button" $left onClick={onCancelOrder} disabled={isCancelling || calculatingOrders}>
            {isCancelling ? (
              <Spinner size="iconSmall" />
            ) : (
              <Text variant="body2" color="inherit">
                Cancel
              </Text>
            )}
          </LightButton>
          <LightButton type="button" onClick={onChangeOrder} disabled={isCancelling || calculatingOrders}>
            <Text variant="body2" color="inherit">
              Change order
            </Text>
          </LightButton>
        </Grid>
      </Stack>
      <TransactionsLink />
    </Stack>
  )
}
