import { CurrencyBalance, findBalance, Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { ConnectionGuard, useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
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
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import styled from 'styled-components'
import { Dec } from '../utils/Decimal'
import { formatBalance, roundDown } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useEpochTimeCountdown } from '../utils/useEpochTimeCountdown'
import { useFocusInvalidInput } from '../utils/useFocusInvalidInput'
import { usePermissions } from '../utils/usePermissions'
import { usePendingCollect, usePool, usePoolMetadata } from '../utils/usePools'
import { useTransactionFeeEstimate } from '../utils/useTransactionFeeEstimate'
import { positiveNumber } from '../utils/validation'
import { useDebugFlags } from './DebugFlags'
import { LoadBoundary } from './LoadBoundary'
import { Spinner } from './Spinner'
import { AnchorTextLink } from './TextLink'

type Props = {
  poolId: string
  trancheId?: string
  defaultTrancheId?: string
  defaultView?: 'invest' | 'redeem'
  view?: 'invest' | 'redeem' | 'start'
  onSetView?: React.Dispatch<React.SetStateAction<'invest' | 'redeem' | 'start'>>
  autoFocus?: boolean
  onCancel?: () => void
}

export function InvestRedeem(props: Props) {
  return (
    <LoadBoundary>
      <ConnectionGuard networks={['centrifuge']}>
        <InvestRedeemInner {...props} />
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

const EpochBusy: React.VFC<{ busy?: boolean }> = ({ busy }) =>
  busy ? (
    <InlineFeedback>
      The pool is busy calculating epoch orders.
      <br />
      Try again later.
    </InlineFeedback>
  ) : null

const InvestRedeemInner: React.VFC<Props> = ({
  poolId,
  trancheId: trancheIdProp,
  defaultTrancheId,
  autoFocus,
  view: viewProp,
  defaultView,
  onSetView,
}) => {
  const [view, setView] = useControlledState<'start' | 'invest' | 'redeem'>(defaultView ?? 'start', viewProp, onSetView)
  const address = useAddress('substrate')
  const permissions = usePermissions(address)
  const balances = useBalances(address)
  const pool = usePool(poolId) as Pool
  const allowedTranches = Object.keys(permissions?.pools[poolId]?.tranches ?? {})
  const [trancheId, setTrancheId] = React.useState(
    trancheIdProp ?? defaultTrancheId ?? allowedTranches[0] ?? pool.tranches[0].id
  )
  const order = usePendingCollect(poolId, trancheId, address)

  const isDataLoading = balances == null || order == null || permissions == null

  const allowedToInvest = !!permissions?.pools[poolId]?.tranches[trancheId]
  const tranche = pool.tranches.find((t) => t.id === trancheId)
  if (!tranche) throw new Error(`Token not found. Pool id: ${poolId}, token id: ${trancheId}`)

  const trancheBalance =
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance.toDecimal() ?? Dec(0)

  const price = tranche.tokenPrice?.toDecimal() ?? Dec(0)
  const investToCollect = order?.payoutTokenAmount.toDecimal() ?? Dec(0)
  const pendingRedeem = order?.remainingRedeemToken.toDecimal() ?? Dec(0)
  const combinedBalance = trancheBalance.add(investToCollect).add(pendingRedeem)
  const invested = combinedBalance.mul(price)

  let actualView = view
  if (order) {
    if (!order.remainingInvestCurrency.isZero()) actualView = 'invest'
    if (!order.remainingRedeemToken.isZero()) actualView = 'redeem'
  }

  if (!address) return null

  const calculatingOrders = pool.epoch.status !== 'ongoing'

  return (
    <Stack as={Card} gap={2} p={2}>
      <Stack>
        <Shelf justifyContent="space-between">
          <Text variant="heading3">Investment value</Text>
          <TextWithPlaceholder variant="heading3" isLoading={isDataLoading}>
            {formatBalance(invested, pool.currency.symbol)}
          </TextWithPlaceholder>
        </Shelf>
        <Shelf justifyContent="space-between">
          <Text variant="label1">Token balance</Text>
          <TextWithPlaceholder variant="label1" isLoading={isDataLoading} width={12} variance={0}>
            {formatBalance(combinedBalance, tranche.currency.symbol)}
          </TextWithPlaceholder>
        </Shelf>
      </Stack>
      {isDataLoading ? (
        <Spinner />
      ) : allowedToInvest ? (
        balances != null && (
          <>
            {!trancheIdProp && allowedTranches.length > 1 && (
              <Select
                placeholder="Select a token"
                options={allowedTranches.map((id) => ({ label: tranche.currency.symbol, value: id }))}
                value={trancheId}
                onSelect={(v) => setTrancheId(v as any)}
              />
            )}
            {order.payoutTokenAmount.isZero() && combinedBalance.isZero() && pendingRedeem.isZero() ? (
              <InvestForm
                poolId={poolId}
                trancheId={trancheId}
                autoFocus={autoFocus}
                investLabel={`Invest in ${tranche.currency.symbol}`}
                onCancel={trancheIdProp ? () => setView('start') : undefined}
              />
            ) : actualView === 'start' ? (
              <>
                {order &&
                  (!order.payoutTokenAmount.isZero() ? (
                    <SuccessBanner
                      title="Investment successful"
                      body={`${formatBalance(order.investCurrency, pool.currency.symbol)} was successfully invested`}
                    />
                  ) : !order.payoutCurrencyAmount.isZero() ? (
                    <SuccessBanner title="Redemption successful" />
                  ) : null)}
                <EpochBusy busy={calculatingOrders} />
                <Stack p={1} gap={1}>
                  <Button variant="secondary" onClick={() => setView('invest')} disabled={calculatingOrders}>
                    Invest more
                  </Button>
                  <Button variant="secondary" onClick={() => setView('redeem')} disabled={calculatingOrders}>
                    Redeem
                  </Button>
                  <TransactionsLink />
                </Stack>
              </>
            ) : actualView === 'invest' ? (
              <InvestForm
                poolId={poolId}
                trancheId={trancheId}
                onCancel={() => setView('start')}
                autoFocus={autoFocus}
              />
            ) : (
              <RedeemForm
                poolId={poolId}
                trancheId={trancheId}
                onCancel={() => setView('start')}
                autoFocus={autoFocus}
              />
            )}
          </>
        )
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
  poolId: string
  trancheId: string
  onCancel?: () => void
  hasInvestment?: boolean
  autoFocus?: boolean
  investLabel?: string
}

const InvestForm: React.VFC<InvestFormProps> = ({
  poolId,
  trancheId,
  onCancel,
  hasInvestment,
  autoFocus,
  investLabel = 'Invest',
}) => {
  const address = useAddress('substrate')
  const balances = useBalances(address)
  const order = usePendingCollect(poolId, trancheId, address)
  const pool = usePool(poolId) as Pool
  const tranche = pool.tranches.find((t) => t.id === trancheId)
  if (!tranche) throw new Error(`Token not found. Pool id: ${poolId}, token id: ${trancheId}`)

  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const nativeBalance = balances ? balances.native.balance.toDecimal() : Dec(0)
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)
  const trancheMeta = metadata?.tranches?.[tranche.id]
  const isFirstInvestment = order?.submittedAt === 0 && order.investCurrency.isZero()
  const minInvest = trancheMeta?.minInitialInvestment
    ? new CurrencyBalance(trancheMeta.minInitialInvestment, pool.currency.decimals)
    : CurrencyBalance.fromFloat(0, 0)
  const { allowInvestBelowMin } = useDebugFlags()

  const price = tranche.tokenPrice?.toDecimal() ?? Dec(0)

  const {
    execute: doInvestTransaction,
    isLoading,
    lastCreatedTransaction,
  } = useCentrifugeTransaction('Invest', (cent) => cent.pools.updateInvestOrder, {
    onSuccess: () => {
      form.resetForm()
      setChangeOrderFormShown(false)
    },
  })

  const { execute: getTxInvestFee, txFee: investTxFee } = useTransactionFeeEstimate(
    (cent) => cent.pools.updateInvestOrder
  )
  React.useEffect(() => {
    // submit dummy tx to get tx fee estimate
    getTxInvestFee([poolId, trancheId, CurrencyBalance.fromFloat(100, 18)])
  }, [poolId, trancheId, getTxInvestFee])

  const { execute: doCancel, isLoading: isLoadingCancel } = useCentrifugeTransaction(
    'Cancel order',
    (cent) => cent.pools.updateInvestOrder,
    {
      onSuccess: () => {
        form.resetForm()
      },
    }
  )

  const pendingInvest = order?.remainingInvestCurrency.toDecimal() ?? Dec(0)
  const hasPendingOrder = !pendingInvest.isZero()

  const combinedBalance = balance.add(pendingInvest)

  const loadingMessage = lastCreatedTransaction?.status === 'pending' ? 'Pending...' : 'Signing...'

  const form = useFormik<{ amount: number | Decimal }>({
    initialValues: {
      amount: 0,
    },
    onSubmit: (values, actions) => {
      const amount = CurrencyBalance.fromFloat(values.amount, pool.currency.decimals)
      doInvestTransaction([poolId, trancheId, amount])
      actions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}
      if (validateNumberInput(values.amount, 0, combinedBalance)) {
        errors.amount = validateNumberInput(values.amount, 0, combinedBalance)
      } else if (hasPendingOrder && Dec(values.amount).eq(pendingInvest)) {
        errors.amount = 'Equals current order'
      } else if (!allowInvestBelowMin && isFirstInvestment && Dec(values.amount).lt(minInvest.toDecimal())) {
        errors.amount = 'Investment amount too low'
      }

      return errors
    },
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  const nativeBalanceTooLow = nativeBalance.lte(investTxFee || 1)

  const inputAmountCoveredByCapacity = inputToDecimal(form.values.amount).lessThanOrEqualTo(
    tranche.capacity.toDecimal() ?? 0
  )
  const calculatingOrders = pool.epoch.status !== 'ongoing'

  function renderInput(cancelCb?: () => void) {
    return (
      <Stack gap={2}>
        <EpochBusy busy={calculatingOrders} />
        {nativeBalanceTooLow && (
          <InlineFeedback>
            {balances &&
              (investTxFee
                ? `This transaction will cost ${investTxFee.toFixed(4)} ${
                    balances.native.currency.symbol
                  }. Please check your balance.`
                : `${balances.native.currency.symbol} balance is too low.`)}
          </InlineFeedback>
        )}
        <Field name="amount" validate={positiveNumber()}>
          {({ field, meta }: FieldProps) => {
            return (
              <CurrencyInput
                {...field}
                onChange={(value) => form.setFieldValue('amount', value)}
                errorMessage={meta.touched ? meta.error : undefined}
                label={`Amount ${isFirstInvestment ? `(min: ${formatBalance(minInvest, pool.currency.symbol)})` : ''}`}
                disabled={isLoading || isLoadingCancel}
                currency={pool.currency.symbol}
                secondaryLabel={pool && balance && `${formatBalance(balance, pool.currency.symbol, 2)} balance`}
                onSetMax={() => form.setFieldValue('amount', balance)}
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
              <TextWithPlaceholder variant="body3" isLoading={isMetadataLoading} width={12} variance={0}>
                {!price.isZero() && `~${formatBalance(Dec(form.values.amount).div(price), tranche!.currency.symbol)}`}
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
            loading={isLoading}
            loadingMessage={loadingMessage}
            disabled={calculatingOrders || nativeBalanceTooLow}
          >
            {changeOrderFormShown ? 'Change order' : investLabel}
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
        {changeOrderFormShown ? (
          renderInput(() => setChangeOrderFormShown(false))
        ) : hasPendingOrder ? (
          <PendingOrder
            type="invest"
            pool={pool}
            amount={pendingInvest}
            onCancelOrder={() => doCancel([poolId, trancheId, new BN(0)])}
            isCancelling={isLoadingCancel}
            onChangeOrder={() => {
              form.resetForm()
              form.setFieldValue('amount', pendingInvest, false)
              setChangeOrderFormShown(true)
            }}
          />
        ) : (
          renderInput(onCancel)
        )}
      </Form>
    </FormikProvider>
  )
}

type RedeemFormProps = {
  poolId: string
  trancheId: string
  onCancel: () => void
  autoFocus?: boolean
}

const RedeemForm: React.VFC<RedeemFormProps> = ({ poolId, trancheId, onCancel, autoFocus }) => {
  const address = useAddress('substrate')
  const balances = useBalances(address)
  const order = usePendingCollect(poolId, trancheId, address)
  const pool = usePool(poolId) as Pool
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)

  const tranche = pool.tranches.find((t) => t.id === trancheId)
  if (!tranche) throw new Error(`Token not found. Pool id: ${poolId}, token id: ${trancheId}`)

  const trancheBalance =
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance.toDecimal() ?? Dec(0)

  const investToCollect = order?.payoutTokenAmount.toDecimal() ?? Dec(0)
  const pendingRedeem = order?.remainingRedeemToken.toDecimal() ?? Dec(0)

  const combinedBalance = trancheBalance.add(investToCollect).add(pendingRedeem)
  const price = tranche.tokenPrice?.toDecimal() ?? Dec(0)
  const maxRedeem = combinedBalance.mul(price)
  const tokenSymbol = tranche.currency.symbol

  if (pool && !tranche) throw new Error('Nonexistent tranche')

  const {
    execute: doRedeemTransaction,
    isLoading,
    lastCreatedTransaction,
  } = useCentrifugeTransaction('Redeem', (cent) => cent.pools.updateRedeemOrder, {
    onSuccess: () => {
      form.resetForm()
      setChangeOrderFormShown(false)
    },
  })
  const { execute: doCancel, isLoading: isLoadingCancel } = useCentrifugeTransaction(
    'Cancel order',
    (cent) => cent.pools.updateRedeemOrder,
    {
      onSuccess: () => {
        form.resetForm()
      },
    }
  )

  // const availableReserve = Dec(pool.reserve.available ?? '0').div('1e18')
  // const redeemCapacity = min(availableReserve.div(price)) // TODO: check risk buffer
  // const inputAmountCoveredByCapacity = inputToDecimal(form.values.amount).lessThanOrEqualTo(redeemCapacity)
  const hasPendingOrder = !pendingRedeem.isZero()

  const loadingMessage = lastCreatedTransaction?.status === 'pending' ? 'Pending...' : 'Signing...'

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
    onSubmit: (values, actions) => {
      const amount = values.amount instanceof Decimal ? values.amount : Dec(values.amount).div(price)
      doRedeemTransaction([poolId, trancheId, TokenBalance.fromFloat(amount, pool.currency.decimals ?? 18)])
      actions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}
      const amount = values.amount instanceof Decimal ? values.amount : Dec(values.amount).div(price)
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
              value={field.value instanceof Decimal ? field.value.mul(price).toNumber() : field.value}
              errorMessage={meta.touched ? meta.error : undefined}
              label="Amount"
              disabled={isLoading || isLoadingCancel}
              onSetMax={() => form.setFieldValue('amount', combinedBalance)}
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
                {!price.isZero() && `~${formatBalance(Dec(form.values.amount).div(price), tokenSymbol)}`}
              </Text>
            </Shelf>
          </Stack>
        ) : null}
        <Stack px={1} gap={1}>
          <Button type="submit" loading={isLoading} loadingMessage={loadingMessage} disabled={calculatingOrders}>
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
        {changeOrderFormShown ? (
          renderInput(() => setChangeOrderFormShown(false))
        ) : hasPendingOrder ? (
          <PendingOrder
            type="redeem"
            pool={pool}
            amount={pendingRedeem.mul(price)}
            onCancelOrder={() => doCancel([poolId, trancheId, new BN(0)])}
            isCancelling={isLoadingCancel}
            onChangeOrder={() => {
              form.resetForm()
              form.setFieldValue('amount', pendingRedeem, false)
              setChangeOrderFormShown(true)
            }}
          />
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
  pool: Pool
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
