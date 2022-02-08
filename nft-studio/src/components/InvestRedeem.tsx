import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import styled from 'styled-components'
import { Dec } from '../utils/Decimal'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { usePermissions } from '../utils/usePermissions'
import { useOrder, usePool, usePoolMetadata } from '../utils/usePools'
import { ButtonGroup } from './ButtonGroup'
import { ConnectButton } from './ConnectButton'
import { TextInput } from './form/base/TextInput'
import { LoadBoundary } from './LoadBoundary'
import { ButtonTextLink } from './TextLink'
import { useWeb3 } from './Web3Provider'

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

const InvestRedeemInner: React.VFC<Props> = ({ poolId, trancheId, action = 'invest', showTabs }) => {
  const [tab, setTab] = React.useState<'invest' | 'redeem'>(action)
  const { selectedAccount } = useWeb3()
  const address = useAddress()
  const { data: permissions } = usePermissions(address)
  const { data: balances } = useBalances(address)
  const { data: pool } = usePool(poolId)

  const allowedToInvest = permissions?.[poolId]?.tranches.includes(trancheId)
  const tranche = pool?.tranches[trancheId]
  const trancheBalance = Dec(
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance ?? '0'
  ).div('1e18')
  const price = Dec(tranche?.tokenPrice ?? 0).div('1e27')
  const invested = trancheBalance.mul(price)

  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Text variant="heading3">
          Invested{' '}
          <Text variant="body1">
            {invested.toFixed(0)} {pool?.currency}
          </Text>
        </Text>
        {/* <Divider /> */}
      </Stack>
      {!trancheBalance.isZero() && showTabs && (
        <Shelf gap={3}>
          <Button variant="text" active={tab === 'invest'} onClick={() => setTab('invest')}>
            Invest
          </Button>
          <Button variant="text" active={tab === 'redeem'} onClick={() => setTab('redeem')}>
            Redeem
          </Button>
        </Shelf>
      )}
      {selectedAccount ? (
        allowedToInvest ? (
          tab === 'invest' ? (
            <InvestForm poolId={poolId} trancheId={trancheId} />
          ) : (
            <RedeemForm poolId={poolId} trancheId={trancheId} />
          )
        ) : (
          <Text>Not allowed to invest</Text>
        )
      ) : (
        <ConnectButton />
      )}
    </Stack>
  )
}

type InvestValues = {
  amount: number | Decimal | ''
}

const InvestForm: React.VFC<Props> = ({ poolId, trancheId }) => {
  const address = useAddress()
  const { data: order, refetch: refetchOrder } = useOrder(poolId, trancheId, address)
  const { data: balances, refetch: refetchBalances } = useBalances(address)
  const { data: pool, refetch: refetchPool } = usePool(poolId)
  const tranche = pool?.tranches[trancheId]
  const balance = Dec(balances?.tokens.find((b) => b.currency === pool?.currency)?.balance ?? 0).div('1e18')
  const pendingInvest = Dec(order?.invest ?? 0).div('1e18')

  const { execute: doInvestTransaction, isLoading } = useCentrifugeTransaction(
    'Invest',
    (cent) => cent.pools.updateInvestOrder,
    {
      onSuccess: () => {
        refetchPool()
        refetchOrder()
        refetchBalances()
        form.resetForm()
      },
    }
  )
  const { execute: doCancel, isLoading: isLoadingCancel } = useCentrifugeTransaction(
    'Cancel order',
    (cent) => cent.pools.updateInvestOrder,
    {
      onSuccess: () => {
        refetchPool()
        refetchOrder()
        refetchBalances()
        form.resetForm()
      },
    }
  )

  const { execute: doCollect, isLoading: isLoadingCollect } = useCentrifugeTransaction(
    'Collect',
    (cent) => cent.pools.collect,
    {
      onSuccess: () => {
        refetchOrder()
        refetchBalances()
      },
    }
  )

  if (pool && !tranche) throw new Error('Nonexistent tranche')

  const totalReserve = Dec(pool?.reserve.total ?? '0').div('1e18')
  const maxReserve = Dec(pool?.reserve.max ?? '0').div('1e18')
  const investmentCapacity = min(maxReserve.minus(totalReserve)) // TODO: check risk buffer and outstanding invest orders

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
  const needsToCollect =
    order &&
    pool &&
    order.epoch <= pool.epoch.lastExecuted &&
    order.epoch > 0 &&
    (order.invest !== '0' || order.redeem !== '0')

  return (
    <FormikProvider value={form}>
      <Form noValidate>
        <Stack gap={3}>
          <Stack>
            <Field name="amount">
              {({ field: { value, ...fieldProps } }: any) => (
                <NumberInput
                  {...fieldProps}
                  value={value instanceof Decimal ? value.toNumber() : value}
                  label="Amount"
                  type="number"
                  min="0"
                  disabled={isLoading || isLoadingCancel || isLoadingCollect}
                />
              )}
            </Field>

            <Text>
              <ButtonTextLink
                onClick={() => {
                  form.setFieldValue('amount', balance)
                }}
              >
                Set max
              </ButtonTextLink>
            </Text>
          </Stack>
          {inputToNumber(form.values.amount) > 0 && inputAmountCoveredByCapacity && (
            <Text variant="label2" color="statusOk">
              Full amount covered by investment capacity ✓
            </Text>
          )}
          {pendingInvest.isZero() ? (
            <ButtonGroup>
              <Button type="submit" disabled={!form.isValid} loading={isLoading}>
                Invest
              </Button>
            </ButtonGroup>
          ) : needsToCollect ? (
            <>
              <Box backgroundColor="backgroundSecondary" p={2}>
                <Text>you need to collect before you can make another investment</Text>
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
                  you have <Text fontWeight={600}>{pendingInvest.toFixed(0)} usd</Text> pending investment
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

const RedeemForm: React.VFC<Props> = ({ poolId, trancheId }) => {
  const address = useAddress()
  const { data: order, refetch: refetchOrder } = useOrder(poolId, trancheId, address)
  const { data: balances, refetch: refetchBalances } = useBalances(address)
  const { data: pool, refetch: refetchPool } = usePool(poolId)
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
        refetchPool()
        refetchOrder()
        refetchBalances()
        form.resetForm()
      },
    }
  )
  const { execute: doCancel, isLoading: isLoadingCancel } = useCentrifugeTransaction(
    'Cancel order',
    (cent) => cent.pools.updateRedeemOrder,
    {
      onSuccess: () => {
        refetchPool()
        refetchOrder()
        refetchBalances()
        form.resetForm()
      },
    }
  )

  const { execute: doCollect, isLoading: isLoadingCollect } = useCentrifugeTransaction(
    'Collect',
    (cent) => cent.pools.collect,
    {
      onSuccess: () => {
        refetchOrder()
        refetchBalances()
      },
    }
  )

  if (pool && !tranche) throw new Error('Nonexistent tranche')

  const availableReserve = Dec(pool?.reserve.available ?? '0').div('1e18')
  const redeemCapacity = min(availableReserve.div(price)) // TODO: check risk buffer
  const needsToCollect =
    order &&
    pool &&
    order.epoch <= pool.epoch.lastExecuted &&
    order.epoch > 0 &&
    (order.invest !== '0' || order.redeem !== '0')

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
                <NumberInput
                  {...fieldProps}
                  value={value instanceof Decimal ? value.toNumber() : value}
                  label="Amount"
                  type="number"
                  min="0"
                  disabled={isLoading || isLoadingCancel || isLoadingCollect}
                />
              )}
            </Field>

            <Text>
              <ButtonTextLink
                onClick={() => {
                  form.setFieldValue('amount', balance)
                }}
              >
                Set max
              </ButtonTextLink>
            </Text>
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

const NumberInput = styled(TextInput)`
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`
NumberInput.defaultProps = {
  type: 'number',
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
