import { DetailedPool } from '@centrifuge/centrifuge-js'
import {
  AnchorButton,
  Box,
  Button,
  Card,
  CurrencyInput,
  Grid,
  IconCheckCircle,
  IconClock,
  IconExternalLink,
  Shelf,
  Stack,
  Text,
  VisualButton,
} from '@centrifuge/fabric'
import css from '@styled-system/css'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import styled from 'styled-components'
import { Dec } from '../utils/Decimal'
import { formatBalance, getCurrencySymbol } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { usePermissions } from '../utils/usePermissions'
import { useOrder, usePendingCollect, usePool, usePoolMetadata } from '../utils/usePools'
import { ButtonGroup } from './ButtonGroup'
import { LoadBoundary } from './LoadBoundary'
import { Spinner } from './Spinner'
import { AnchorTextLink } from './TextLink'
import { TextWithPlaceholder } from './TextWithPlaceholder'

type Props = {
  poolId: string
  trancheId: number
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

type Balances = Exclude<ReturnType<typeof useBalances>, undefined>

function getBalanceDec(balances: Balances, currency: string) {
  if (currency === 'native') {
    return Dec(balances.native.balance).div(Dec(10).pow(balances.native.decimals))
  }
  const entry = balances.currencies.find((c) => c.currency === currency)
  if (!entry) throw new Error(`invalid currency: ${currency}`)
  return Dec(entry.balance).div('1e18')
}

function min(...nums: Decimal[]) {
  return nums.reduce((a, b) => (a.greaterThan(b) ? b : a))
}

function inputToNumber(num: number | Decimal | '') {
  return num instanceof Decimal ? num.toNumber() : num || 0
}
function inputToDecimal(num: number | Decimal | string) {
  return Dec(num || 0)
}

function validateNumberInput(value: number | string, min: number | Decimal, max?: number | Decimal) {
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

function getEpochHoursRemaining(pool: DetailedPool) {
  const last = pool.epoch.lastClosed * 1000
  const min = pool.minEpochTime * 1000
  const now = Date.now()
  return Math.max(0, last + min - now) / (1000 * 60 * 60)
}

const InvestRedeemInner: React.VFC<Props> = ({ poolId, trancheId }) => {
  const [view, setView] = React.useState<'start' | 'invest' | 'redeem'>('start')
  const address = useAddress()
  const permissions = usePermissions(address)
  const balances = useBalances(address)
  const pool = usePool(poolId)
  const order = usePendingCollect(poolId, trancheId, address)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)

  console.log('order', order, balances)
  const isDataLoading = balances === undefined || order === undefined || permissions === undefined

  const allowedToInvest = permissions?.[poolId]?.tranches.includes(trancheId)
  const tranche = pool?.tranches[trancheId]
  const trancheBalance = Dec(
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance ?? '0'
  ).div('1e18')
  const price = Dec(tranche?.tokenPrice ?? 0).div('1e27')
  const investToCollect = Dec(order?.payoutTokenAmount || 0).div('1e18')
  const redeemToCollect = Dec(order?.payoutCurrencyAmount || 0).div('1e18')
  const invested = trancheBalance.add(investToCollect).mul(price).minus(redeemToCollect)

  let actualView = view
  if (order) {
    if (order.remainingInvestCurrency !== '0') actualView = 'invest'
    if (order.remainingRedeemToken !== '0') actualView = 'redeem'
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
            {formatBalance(trancheBalance, metadata?.tranches?.[trancheId]?.symbol)}
          </TextWithPlaceholder>
        </Shelf>
      </Stack>
      {isDataLoading ? (
        <Spinner />
      ) : allowedToInvest ? (
        balances !== undefined &&
        (trancheBalance.isZero() ? (
          <InvestForm poolId={poolId} trancheId={trancheId} />
        ) : actualView === 'start' ? (
          <>
            {order &&
              (order.payoutTokenAmount !== '0' ? (
                <SuccessBanner
                  title="Investment successful"
                  body={`${formatBalance(
                    Dec(order.investCurrency).div('1e18'),
                    pool?.currency
                  )} USD was successfully invested`}
                />
              ) : order.payoutCurrencyAmount !== '0' ? (
                <SuccessBanner title="Redemption successful" />
              ) : null)}
            <Stack p={1} gap={1}>
              <Button variant="outlined" onClick={() => setView('invest')}>
                Invest more
              </Button>
              <Button variant="outlined" onClick={() => setView('redeem')}>
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
  trancheId: number
  onCancel?: () => void
}

const InvestForm: React.VFC<InvestFormProps> = ({ poolId, trancheId, onCancel }) => {
  const address = useAddress()
  const balances = useBalances(address)
  const order = usePendingCollect(poolId, trancheId, address)
  const pool = usePool(poolId)
  const tranche = pool?.tranches[trancheId]
  const balance = balances && pool ? getBalanceDec(balances, pool.currency) : Dec(0)
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)

  if (pool && !tranche) throw new Error('Nonexistent tranche')

  const price = Dec(tranche?.tokenPrice ?? 0).div('1e27')

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
  const pendingInvest = Dec(order?.remainingInvestCurrency ?? '0').div('1e18')
  // const investmentCapacity = min(maxReserve.minus(totalReserve)) // TODO: check risk buffer and outstanding invest orders
  // const needsToCollect = order?.payoutCurrencyAmount !== '0' || order?.payoutTokenAmount !== '0'
  const hasPendingOrder = !pendingInvest.isZero()

  const form = useFormik({
    initialValues: {
      amount: 0,
    },
    onSubmit: (values, actions) => {
      const amount = Dec(values.amount).mul('1e18').toString()
      doInvestTransaction([poolId, trancheId, new BN(amount)])
      actions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}

      if (validateNumberInput(values.amount, 0, balance)) {
        errors.amount = validateNumberInput(values.amount, 0, balance)
      } else if (hasPendingOrder && inputToDecimal(values.amount).eq(pendingInvest)) {
        errors.amount = 'Equals current order'
      }

      return errors
    },
  })

  // const inputAmountCoveredByCapacity = inputToDecimal(form.values.amount).lessThanOrEqualTo(investmentCapacity)

  const loadingMessage =
    lastCreatedTransaction?.status === 'pending' ? 'Awaiting confirmation...' : 'Signing transaction...'

  function renderInput(cancelCb?: () => void) {
    return (
      <Stack gap={2}>
        <Field name="amount">
          {({ field: { value, ...fieldProps }, meta }: FieldProps) => (
            <CurrencyInput
              {...fieldProps}
              value={value instanceof Decimal ? value.toNumber() : value}
              errorMessage={meta.touched ? meta.error : undefined}
              label="Amount"
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
        {form.values.amount ? (
          <Stack px={2} gap="4px">
            <Shelf justifyContent="space-between">
              <Text variant="body3">Token amount</Text>
              <TextWithPlaceholder variant="body3" isLoading={isMetadataLoading} width={12} variance={0}>
                {price.isZero()
                  ? `~ ∞ ${metadata?.tranches?.[trancheId]?.symbol}`
                  : `~${formatBalance(Dec(form.values.amount).div(price), metadata?.tranches?.[trancheId]?.symbol)}`}
              </TextWithPlaceholder>
            </Shelf>

            <Text variant="body3" color="textSecondary">
              The investment amount will be locked and executed at the end of the current epoch.
            </Text>
          </Stack>
        ) : null}
        <Stack px={1} gap={1}>
          <Button
            type="submit"
            variant="containedSecondary"
            disabled={!form.isValid}
            loading={isLoading}
            loadingMessage={loadingMessage}
          >
            Invest
          </Button>
          {cancelCb && (
            <Button variant="outlined" onClick={cancelCb}>
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    )
  }

  function renderPendingOrder() {
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
              <Text variant="body2" fontWeight={600}>
                {pendingInvest.toFixed(0)} {getCurrencySymbol(pool?.currency)} investment locked
              </Text>
            </Shelf>
            <Text variant="body3">
              Locked investments are executed at the end of the epoch ({getEpochHoursRemaining(pool!)} hrs remaining).{' '}
              <br />
              <AnchorTextLink href="about:blank">Learn more</AnchorTextLink>
            </Text>
          </Stack>
          <Grid gap="1px" columns={2} equalColumns>
            <LightButton
              type="button"
              $left
              onClick={() => doCancel([poolId, trancheId, new BN(0)])}
              disabled={isLoadingCancel}
            >
              <VisualButton variant="text" loading={isLoadingCancel} small>
                Cancel
              </VisualButton>
            </LightButton>
            <LightButton
              type="button"
              onClick={() => {
                form.resetForm()
                setChangeOrderFormShown(true)
              }}
              disabled={isLoadingCancel}
            >
              <VisualButton variant="text" small>
                Change order
              </VisualButton>
            </LightButton>
          </Grid>
        </Stack>
        <TransactionsLink />
      </Stack>
    )
  }

  return (
    <FormikProvider value={form}>
      <Form noValidate>
        {changeOrderFormShown ? renderInput() : hasPendingOrder ? renderPendingOrder() : renderInput(onCancel)}
      </Form>
    </FormikProvider>
  )
}

type RedeemFormProps = {
  poolId: string
  trancheId: number
  onCancel?: () => void
}

const RedeemForm: React.VFC<RedeemFormProps> = ({ poolId, trancheId, onCancel }) => {
  const address = useAddress()
  const order = useOrder(poolId, trancheId, address)
  const balances = useBalances(address)
  const pool = usePool(poolId)

  const { data: metadata } = usePoolMetadata(pool)
  const tranche = pool?.tranches[trancheId]
  const balance = Dec(
    balances?.tranches.find((b) => b.poolId === poolId && b.trancheId === trancheId)?.balance ?? 0
  ).div('1e18')
  const pendingRedeem = Dec(order?.redeem ?? 0).div('1e18')
  const price = Dec(tranche?.tokenPrice ?? 0).div('1e27')

  const { execute: doRedeemTransaction, isLoading } = useCentrifugeTransaction(
    'Invest',
    (cent) => cent.pools.updateRedeemOrder,
    {
      onSuccess: () => {
        form.resetForm()
      },
    }
  )
  const { execute: doCancel, isLoading: isLoadingCancel } = useCentrifugeTransaction(
    'Cancel order',
    (cent) => cent.pools.updateRedeemOrder,
    {
      onSuccess: () => {
        form.resetForm()
      },
    }
  )

  const { execute: doCollect, isLoading: isLoadingCollect } = useCentrifugeTransaction(
    'Collect',
    (cent) => cent.pools.collect
  )

  if (pool && !tranche) throw new Error('Nonexistent tranche')

  const availableReserve = Dec(pool?.reserve.available ?? '0').div('1e18')
  const redeemCapacity = min(availableReserve.div(price)) // TODO: check risk buffer
  const needsToCollect =
    order && pool && order.epoch <= pool.epoch.lastExecuted && order.epoch > 0 && order.redeem !== '0'

  const form = useFormik({
    initialValues: {
      amount: 0,
    },
    onSubmit: (values, actions) => {
      const amount = Dec(values.amount).mul('1e18').toString()
      doRedeemTransaction([poolId, trancheId, new BN(amount)])
      actions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<InvestValues> = {}

      if (validateNumberInput(values.amount, 0, balance)) {
        errors.amount = validateNumberInput(values.amount, 0, balance)
      }

      return errors
    },
  })

  const inputAmountCoveredByCapacity = inputToDecimal(form.values.amount).lessThanOrEqualTo(redeemCapacity)

  return (
    <FormikProvider value={form}>
      <Form noValidate>
        <Stack gap={3}>
          <Stack>
            <Field name="amount">
              {({ field: { value, ...fieldProps } }: any) => (
                <CurrencyInput
                  {...fieldProps}
                  value={value instanceof Decimal ? value.toNumber() : value}
                  label="Amount"
                  type="number"
                  min="0"
                  disabled={isLoading || isLoadingCancel || isLoadingCollect}
                  onSetMax={() => form.setFieldValue('amount', balance)}
                />
              )}
            </Field>
          </Stack>
          {inputToNumber(form.values.amount) > 0 && inputAmountCoveredByCapacity && (
            <Text variant="label2" color="statusOk">
              Full amount covered by pool reserve ✓
            </Text>
          )}
          {pendingRedeem.isZero() ? (
            <ButtonGroup>
              <Button type="submit" disabled={!form.isValid} loading={isLoading}>
                Redeem
              </Button>
            </ButtonGroup>
          ) : needsToCollect ? (
            <>
              <Box backgroundColor="backgroundSecondary" p={2}>
                <Text>you need to collect before you can make another redeem order</Text>
              </Box>
              <ButtonGroup>
                <Button onClick={() => doCollect([poolId, trancheId])} loading={isLoadingCollect}>
                  Collect
                </Button>
              </ButtonGroup>
            </>
          ) : (
            <>
              <Box backgroundColor="backgroundSecondary" p={2}>
                <Text>
                  you have{' '}
                  <Text fontWeight={600}>
                    {pendingRedeem.toFixed(0)} {metadata?.tranches?.[trancheId]?.symbol ?? ''}
                  </Text>{' '}
                  pending redemption
                </Text>
              </Box>
              <ButtonGroup>
                <Button type="submit" disabled={!form.isValid} loading={isLoading}>
                  Update
                </Button>
                <Button
                  onClick={() => {
                    doCancel([poolId, trancheId, new BN(0)])
                  }}
                  loading={isLoadingCancel}
                >
                  Cancel order
                </Button>
              </ButtonGroup>
            </>
          )}
        </Stack>
      </Form>
    </FormikProvider>
  )
}

const TransactionsLink: React.FC = () => {
  const address = useAddress()
  return (
    <Box alignSelf="flex-end">
      <AnchorButton
        variant="text"
        iconRight={IconExternalLink}
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
        <IconCheckCircle size="iconSmall" />
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
  },
  (props) =>
    css({
      borderBottomLeftRadius: props.$left ? 'card' : undefined,
      borderBottomRightRadius: props.$left ? undefined : 'card',
      backgroundColor: 'secondarySelectedBackground',
      // '&:hover, &:focus-visible': {
      //   color: 'textSelected'
      // }
    })
)
