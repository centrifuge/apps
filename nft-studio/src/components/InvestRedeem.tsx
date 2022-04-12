import { Box, Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Dec } from '../utils/Decimal'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { usePermissions } from '../utils/usePermissions'
import { useOrder, usePendingCollect, usePool, usePoolMetadata } from '../utils/usePools'
import { ButtonGroup } from './ButtonGroup'
import { LoadBoundary } from './LoadBoundary'
import { Spinner } from './Spinner'
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

const currencySymbols = {
  native: 'AIR',
  usd: 'kUSD',
}

function getCurrencySymbol(currency?: string) {
  return (currency && currencySymbols[currency as keyof typeof currencySymbols]) || ''
}

function getBalanceDec(balances: Balances, currency: string) {
  if (currency === 'native') {
    return Dec(balances.native.balance).div(Dec(10).pow(balances.native.decimals))
  }
  const entry = balances.currencies.find((c) => c.currency === currency)
  if (!entry) throw new Error(`invalid currency: ${currency}`)
  return Dec(entry.balance).div('1e18')
}

const InvestRedeemInner: React.VFC<Props> = ({ poolId, trancheId }) => {
  const [view, setView] = React.useState<'start' | 'invest' | 'redeem'>('start')
  const address = useAddress()
  const permissions = usePermissions(address)
  const balances = useBalances(address)
  const pool = usePool(poolId)
  const order = useOrder(poolId, trancheId, address)
  const pendingCollect = usePendingCollect(poolId, trancheId, address)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)

  console.log('order', order, pendingCollect, balances)
  const isDataLoading =
    balances === undefined || order === undefined || pendingCollect === undefined || permissions === undefined

  const allowedToInvest = permissions?.[poolId]?.tranches.includes(trancheId)
  const tranche = pool?.tranches[trancheId]
  const trancheBalance = Dec(
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance ?? '0'
  ).div('1e18')
  const price = Dec(tranche?.tokenPrice ?? 0).div('1e27')
  const invested = trancheBalance.mul(price)

  let actualView = view
  if (pendingCollect) {
    if (pendingCollect.remainingInvestCurrency !== '0') actualView = 'invest'
    if (pendingCollect.remainingRedeemToken !== '0') actualView = 'redeem'
  }

  if (!address) return null

  return (
    <Stack as={Card} gap={2} p={2}>
      <Stack>
        <Shelf justifyContent="space-between">
          <Text variant="heading3">Investment value</Text>
          <TextWithPlaceholder variant="heading3" isLoading={isDataLoading}>
            {invested.toFixed(0)} {getCurrencySymbol(pool?.currency)}
          </TextWithPlaceholder>
        </Shelf>
        <Shelf justifyContent="space-between">
          <Text variant="label1">Token balance</Text>
          <TextWithPlaceholder variant="label1" isLoading={isDataLoading || isMetadataLoading} width={12} variance={0}>
            {trancheBalance.toFixed(0)} {metadata?.tranches?.[trancheId]?.symbol}
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
          <Stack p={1} gap={1}>
            <Button variant="containedSecondary" onClick={() => setView('invest')}>
              Invest
            </Button>
            <Button variant="outlined" onClick={() => setView('redeem')}>
              Redeem
            </Button>
          </Stack>
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
  // const order = useOrder(poolId, trancheId, address)
  const balances = useBalances(address)
  const pendingCollect = usePendingCollect(poolId, trancheId, address)
  const pool = usePool(poolId)
  const tranche = pool?.tranches[trancheId]
  const balance = balances && pool ? getBalanceDec(balances, pool.currency) : Dec(0)
  // const orderInvest = Dec(order?.invest ?? 0).div('1e18')

  const { execute: doInvestTransaction, isLoading } = useCentrifugeTransaction(
    'Invest',
    (cent) => cent.pools.updateInvestOrder,
    {
      onSuccess: () => {
        form.resetForm()
      },
    }
  )
  const { execute: doCancel, isLoading: isLoadingCancel } = useCentrifugeTransaction(
    'Cancel order',
    (cent) => cent.pools.updateInvestOrder,
    {
      onSuccess: () => {
        form.resetForm()
      },
    }
  )

  if (pool && !tranche) throw new Error('Nonexistent tranche')

  const totalReserve = Dec(pool?.reserve.total ?? '0').div('1e18')
  const maxReserve = Dec(pool?.reserve.max ?? '0').div('1e18')
  const pendingInvest = Dec(pendingCollect?.remainingInvestCurrency ?? '0').div('1e18')
  const investmentCapacity = min(maxReserve.minus(totalReserve)) // TODO: check risk buffer and outstanding invest orders
  const needsToCollect = pendingCollect?.payoutCurrencyAmount !== '0' || pendingCollect?.payoutTokenAmount !== '0'
  // order && pool && order.epoch <= pool.epoch.lastExecuted && order.epoch > 0 && order.invest !== '0'
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
      }

      return errors
    },
  })

  const inputAmountCoveredByCapacity = inputToDecimal(form.values.amount).lessThanOrEqualTo(investmentCapacity)

  function renderInput() {
    return (
      <Stack gap={2}>
        <Field name="amount">
          {({ field: { value, ...fieldProps } }: any) => (
            <CurrencyInput
              {...fieldProps}
              value={value instanceof Decimal ? value.toNumber() : value}
              label="Amount"
              type="number"
              min="0"
              disabled={isLoading || isLoadingCancel}
              onSetMax={() => form.setFieldValue('amount', balance)}
              currency={getCurrencySymbol(pool?.currency)}
              secondaryLabel={pool && balance && `${balance.toFixed(0)} ${getCurrencySymbol(pool?.currency)} balance`}
            />
          )}
        </Field>
        {inputToNumber(form.values.amount) > 0 && inputAmountCoveredByCapacity && (
          <Text variant="label2" color="statusOk">
            Full amount covered by investment capacity ✓
          </Text>
        )}
        <Stack px={1} gap={1}>
          <Button type="submit" variant="containedSecondary" disabled={!form.isValid} loading={isLoading}>
            Invest
          </Button>
          {onCancel && (
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    )
  }

  function renderPendingOrder() {
    return (
      <Box backgroundColor="secondarySelectedBackground">
        <Box p={2}>
          <Text>
            you have <Text fontWeight={600}>{pendingInvest.toFixed(0)} usd</Text> pending investment
          </Text>
        </Box>
        <Shelf justifyContent="space-evenly">
          <Button
            variant="text"
            onClick={() => {
              doCancel([poolId, trancheId, new BN(0)])
            }}
            loading={isLoadingCancel}
          >
            Cancel
          </Button>
          <Button
            variant="text"
            //  type="submit" disabled={!form.isValid} loading={isLoading}
          >
            Change
          </Button>
        </Shelf>
      </Box>
    )
  }

  return (
    <FormikProvider value={form}>
      <Form noValidate>{hasPendingOrder ? renderPendingOrder() : renderInput()}</Form>
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
