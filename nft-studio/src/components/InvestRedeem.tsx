import { Balance, DetailedPool } from '@centrifuge/centrifuge-js'
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
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import css from '@styled-system/css'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import styled from 'styled-components'
import { getEpochTimeRemaining } from '../utils/date'
import { Dec } from '../utils/Decimal'
import { formatBalance, getCurrencySymbol } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { getBalanceDec, useBalances } from '../utils/useBalances'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useFocusInvalidInput } from '../utils/useFocusInvalidInput'
import { usePermissions } from '../utils/usePermissions'
import { usePendingCollect, usePool, usePoolMetadata } from '../utils/usePools'
import { useDebugFlags } from './DebugFlags'
import { LoadBoundary } from './LoadBoundary'
import { Spinner } from './Spinner'
import { AnchorTextLink } from './TextLink'
import { TextWithPlaceholder } from './TextWithPlaceholder'

type Props = {
  poolId: string
  trancheId: string
  action?: 'invest' | 'redeem'
  showTabs?: boolean
}

export const InvestRedeem: React.VFC<Props> = (props) => {
  return (
    <LoadBoundary>
      <InvestRedeemInner {...props} />
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
  if (value === '') {
    return 'Not a valid number'
  }
  if (max && Dec(value).greaterThan(Dec(max))) {
    return 'Value too large'
  }
  if (Dec(value).lessThan(Dec(min))) {
    return 'Value too small'
  }
}

const InvestRedeemInner: React.VFC<Props> = ({ poolId, trancheId }) => {
  const [view, setView] = React.useState<'start' | 'invest' | 'redeem'>('start')
  const address = useAddress()
  const permissions = usePermissions(address)
  const balances = useBalances(address)
  const pool = usePool(poolId)
  const order = usePendingCollect(poolId, trancheId, address)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)

  const isDataLoading = balances === undefined || order === undefined || permissions === undefined

  const allowedToInvest = !!permissions?.pools[poolId]?.tranches[trancheId]
  const tranche = pool?.tranches.find((t) => t.id === trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.id] : null
  const trancheBalance =
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance.toDecimal() ?? Dec(0)

  const price = tranche?.tokenPrice.toDecimal() ?? Dec(0)
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

  return (
    <Stack as={Card} gap={2} p={2}>
      <Stack>
        <Shelf justifyContent="space-between">
          <Text variant="heading3">Investment value</Text>
          <TextWithPlaceholder variant="heading3" isLoading={isDataLoading}>
            {formatBalance(invested, pool?.currency)}
          </TextWithPlaceholder>
        </Shelf>
        <Shelf justifyContent="space-between">
          <Text variant="label1">Token balance</Text>
          <TextWithPlaceholder variant="label1" isLoading={isDataLoading || isMetadataLoading} width={12} variance={0}>
            {formatBalance(combinedBalance, trancheMeta?.symbol)}
          </TextWithPlaceholder>
        </Shelf>
      </Stack>
      {isDataLoading ? (
        <Spinner />
      ) : allowedToInvest ? (
        balances !== undefined &&
        (order.payoutTokenAmount.isZero() && combinedBalance.isZero() && pendingRedeem.isZero() ? (
          <InvestForm poolId={poolId} trancheId={trancheId} />
        ) : actualView === 'start' ? (
          <>
            {order &&
              (!order.payoutTokenAmount.isZero() ? (
                <SuccessBanner
                  title="Investment successful"
                  body={`${formatBalance(order.investCurrency, pool?.currency)} was successfully invested`}
                />
              ) : !order.payoutCurrencyAmount.isZero() ? (
                <SuccessBanner title="Redemption successful" />
              ) : null)}
            <Stack p={1} gap={1}>
              <Button variant="secondary" onClick={() => setView('invest')}>
                Invest more
              </Button>
              <Button variant="secondary" onClick={() => setView('redeem')}>
                Redeem
              </Button>
              <TransactionsLink />
            </Stack>
          </>
        ) : actualView === 'invest' ? (
          <InvestForm poolId={poolId} trancheId={trancheId} onCancel={() => setView('start')} />
        ) : (
          <RedeemForm poolId={poolId} trancheId={trancheId} onCancel={() => setView('start')} />
        ))
      ) : (
        <Text>Not allowed to invest</Text>
      )}
    </Stack>
  )
}

type InvestValues = {
  amount: number | Decimal | ''
}

type InvestFormProps = {
  poolId: string
  trancheId: string
  onCancel?: () => void
  hasInvestment?: boolean
}

const InvestForm: React.VFC<InvestFormProps> = ({ poolId, trancheId, onCancel, hasInvestment }) => {
  const address = useAddress()
  const balances = useBalances(address)
  const order = usePendingCollect(poolId, trancheId, address)
  const pool = usePool(poolId)
  const tranche = pool?.tranches.find((t) => t.id === trancheId)
  const balance = balances && pool ? getBalanceDec(balances, pool.currency) : Dec(0)
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.id] : null
  const isFirstInvestment = order?.epoch === 0 && order.investCurrency.isZero()
  const minInvest = trancheMeta?.minInitialInvestment
    ? new Balance(trancheMeta.minInitialInvestment)
    : Balance.fromFloat(0)
  const { allowInvestBelowMin } = useDebugFlags()

  if (pool && !tranche) throw new Error('Nonexistent tranche')

  const price = tranche?.tokenPrice.toDecimal() ?? Dec(0)

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
  const { execute: doCancel, isLoading: isLoadingCancel } = useCentrifugeTransaction(
    'Cancel order',
    (cent) => cent.pools.updateInvestOrder,
    {
      onSuccess: () => {
        form.resetForm()
      },
    }
  )

  // const totalReserve = Dec(pool?.reserve.total ?? '0').div('1e18')
  // const maxReserve = Dec(pool?.reserve.max ?? '0').div('1e18')
  const pendingInvest = order?.remainingInvestCurrency.toDecimal() ?? Dec(0)
  // const investmentCapacity = min(maxReserve.minus(totalReserve)) // TODO: check risk buffer and outstanding invest orders
  // const needsToCollect = order?.payoutCurrencyAmount !== '0' || order?.payoutTokenAmount !== '0'
  const hasPendingOrder = !pendingInvest.isZero()
  // const inputAmountCoveredByCapacity = inputToDecimal(form.values.amount).lessThanOrEqualTo(investmentCapacity)

  const combinedBalance = balance.add(pendingInvest)

  const loadingMessage = lastCreatedTransaction?.status === 'pending' ? 'Pending...' : 'Signing...'

  const form = useFormik<{ amount: number | Decimal }>({
    initialValues: {
      amount: 0,
    },
    onSubmit: (values, actions) => {
      const amount = Balance.fromFloat(values.amount)
      doInvestTransaction([poolId, trancheId, amount])
      actions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}

      if (validateNumberInput(values.amount, 0, combinedBalance)) {
        errors.amount = validateNumberInput(values.amount, 0, combinedBalance)
      } else if (hasPendingOrder && inputToDecimal(values.amount).eq(pendingInvest)) {
        errors.amount = 'Equals current order'
      } else if (!allowInvestBelowMin && isFirstInvestment && Dec(form.values.amount).lt(minInvest.toDecimal())) {
        errors.amount = 'Investment amount too low'
      }

      return errors
    },
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  function renderInput(cancelCb?: () => void) {
    return (
      <Stack gap={2}>
        <Field name="amount">
          {({ field: { value, ...fieldProps }, meta }: FieldProps) => (
            <CurrencyInput
              {...fieldProps}
              value={value instanceof Decimal ? value.toNumber() : value}
              errorMessage={meta.touched ? meta.error : undefined}
              label={`Amount ${isFirstInvestment ? `(min: ${formatBalance(minInvest, pool?.currency)})` : ''}`}
              type="number"
              min="0"
              disabled={isLoading || isLoadingCancel}
              onSetMax={() => form.setFieldValue('amount', balance)}
              currency={getCurrencySymbol(pool?.currency)}
              secondaryLabel={pool && balance && `${formatBalance(balance, pool?.currency)} balance`}
            />
          )}
        </Field>
        {/* {inputToNumber(form.values.amount) > 0 && inputAmountCoveredByCapacity && (
          <Text variant="label2" color="statusOk">
            Full amount covered by investment capacity ✓
          </Text>
        )} */}
        {inputToNumber(form.values.amount) > 0 ? (
          <Stack px={2} gap="4px">
            <Shelf justifyContent="space-between">
              <Text variant="body3">Token amount</Text>
              <TextWithPlaceholder variant="body3" isLoading={isMetadataLoading} width={12} variance={0}>
                {!price.isZero() && `~${formatBalance(Dec(form.values.amount).div(price), trancheMeta?.symbol)}`}
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
          <Button type="submit" loading={isLoading} loadingMessage={loadingMessage}>
            Invest
          </Button>
          {cancelCb && (
            <Button variant="secondary" onClick={cancelCb}>
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
            pool={pool!}
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
}

const RedeemForm: React.VFC<RedeemFormProps> = ({ poolId, trancheId, onCancel }) => {
  const address = useAddress()
  const balances = useBalances(address)
  const order = usePendingCollect(poolId, trancheId, address)
  const pool = usePool(poolId)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)

  const tranche = pool?.tranches.find((t) => t.id === trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.id] : null

  const trancheBalance =
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance.toDecimal() ?? Dec(0)

  const investToCollect = order?.payoutTokenAmount.toDecimal() ?? Dec(0)
  const pendingRedeem = order?.remainingRedeemToken.toDecimal() ?? Dec(0)

  const combinedBalance = trancheBalance.add(investToCollect).add(pendingRedeem)
  const price = tranche?.tokenPrice.toDecimal() ?? Dec(0)
  const maxRedeem = combinedBalance.mul(price)
  const tokenSymbol = trancheMeta?.symbol ?? ''

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

  // const availableReserve = Dec(pool?.reserve.available ?? '0').div('1e18')
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
  const form = useFormik<{ amount: number | Decimal }>({
    initialValues: {
      amount: 0,
    },
    onSubmit: (values, actions) => {
      const amount = (values.amount instanceof Decimal ? values.amount : Dec(values.amount).div(price))
        .mul('1e18')
        .toFixed(0)
      doRedeemTransaction([poolId, trancheId, new BN(amount)])
      actions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}

      if (!(values.amount instanceof Decimal) && validateNumberInput(values.amount, 0, maxRedeem)) {
        errors.amount = validateNumberInput(values.amount, 0, maxRedeem)
      } else if (hasPendingOrder && inputToDecimal(values.amount).eq(pendingRedeem)) {
        errors.amount = 'Equals current order'
      }

      return errors
    },
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  function renderInput(cancelCb?: () => void) {
    return (
      <Stack gap={2}>
        <Field name="amount">
          {({ field: { value, ...fieldProps }, meta }: FieldProps) => (
            <CurrencyInput
              {...fieldProps}
              value={value instanceof Decimal ? value.mul(price).toNumber() : value}
              errorMessage={meta.touched ? meta.error : undefined}
              label="Amount"
              type="number"
              min="0"
              disabled={isLoading || isLoadingCancel}
              onSetMax={() => form.setFieldValue('amount', combinedBalance)}
              currency={getCurrencySymbol(pool?.currency)}
            />
          )}
        </Field>
        {inputToNumber(form.values.amount) > 0 ? (
          <Stack px={2} gap="4px">
            <Shelf justifyContent="space-between">
              <Text variant="body3">Token amount</Text>
              <TextWithPlaceholder variant="body3" isLoading={isMetadataLoading} width={12} variance={0}>
                {!price.isZero() &&
                  `~${formatBalance(
                    form.values.amount instanceof Decimal ? form.values.amount : Dec(form.values.amount).div(price),
                    tokenSymbol
                  )}`}
              </TextWithPlaceholder>
            </Shelf>
          </Stack>
        ) : null}
        <Stack px={1} gap={1}>
          <Button type="submit" loading={isLoading} loadingMessage={loadingMessage}>
            Redeem
          </Button>
          {cancelCb && (
            <Button variant="secondary" onClick={cancelCb}>
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
            pool={pool!}
            amount={pendingRedeem}
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
  const address = useAddress()
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
    })
)

const PendingOrder: React.FC<{
  type: 'invest' | 'redeem'
  amount: Decimal
  pool: DetailedPool
  onCancelOrder: () => void
  isCancelling: boolean
  onChangeOrder: () => void
}> = ({ type, amount, pool, onCancelOrder, isCancelling, onChangeOrder }) => {
  const { hours: hoursRemaining, minutes: minutesRemaining } = getEpochTimeRemaining(pool!)
  return (
    <Stack gap={2}>
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
              {formatBalance(amount, pool.currency)} locked
            </Text>
          </Shelf>
          <Text variant="body3">
            Locked {type === 'invest' ? 'investments' : 'redemptions'} are executed at the end of the epoch (
            {hoursRemaining} hrs and ${minutesRemaining} min remaining).{' '}
            <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink>
          </Text>
        </Stack>
        <Grid gap="1px" columns={2} equalColumns>
          <LightButton type="button" $left onClick={onCancelOrder} disabled={isCancelling}>
            {isCancelling ? (
              <Spinner size="iconSmall" />
            ) : (
              <Text variant="body2" color="inherit">
                Cancel
              </Text>
            )}
          </LightButton>
          <LightButton type="button" onClick={onChangeOrder} disabled={isCancelling}>
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
