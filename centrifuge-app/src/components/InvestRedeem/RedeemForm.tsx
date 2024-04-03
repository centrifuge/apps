import { Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { Box, Button, CurrencyInput, SelectInner, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePool } from '../../utils/usePools'
import { positiveNumber } from '../../utils/validation'
import { ButtonGroup } from '../ButtonGroup'
import { Claim } from './Claim'
import { EpochBusy } from './EpochBusy'
import { useInvestRedeem } from './InvestRedeemProvider'
import { PendingOrder } from './PendingOrder'
import { SuccessBanner } from './SuccessBanner'
import { inputToNumber, validateNumberInput } from './utils'

type RedeemFormProps = {
  autoFocus?: boolean
}

type RedeemValues = {
  amount: number | ''
}

export function RedeemForm({ autoFocus }: RedeemFormProps) {
  const { state, actions, hooks } = useInvestRedeem()
  const pool = usePool(state.poolId) as Pool
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
      const errors: FormikErrors<RedeemValues> = {}
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
  const isApproving = state.pendingAction === 'approveTrancheToken' && isPending

  const calculatingOrders = pool.epoch.status !== 'ongoing'

  const preSubmitAction = () => {
    if (state.needsTrancheTokenApproval(inputToNumber(form.values.amount))) {
      return {
        onClick: () =>
          actions.approveTrancheToken(TokenBalance.fromFloat(form.values.amount, state.trancheCurrency!.decimals)),
        loading: isApproving,
      }
    }
  }

  return (
    <FormikProvider value={form}>
      <Form noValidate ref={formRef}>
        <Stack gap={2}>
          {state.order && !state.order.payoutCurrencyAmount.isZero() && (
            <SuccessBanner
              title="Redemption successful"
              body={
                <Stack gap={1}>
                  <div>
                    Redeemed {state.poolCurrency?.displayName}:{' '}
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
                disabled={isRedeeming || hasPendingOrder}
                onSetMax={() => form.setFieldValue('amount', state.trancheBalanceWithPending)}
                onChange={(value) => form.setFieldValue('amount', value)}
                currency={
                  state?.poolCurrencies.length > 1 ? (
                    <SelectInner
                      {...field}
                      onChange={(e) => {
                        actions.selectPoolCurrency(e.target.value)
                      }}
                      value={state.poolCurrency?.symbol}
                      options={state?.poolCurrencies.map((c) => ({ value: c.symbol, label: c.displayName }))}
                      style={{ textAlign: 'right' }}
                    />
                  ) : (
                    state.poolCurrency?.displayName
                  )
                }
                secondaryLabel={`${formatBalance(
                  roundDown(maxRedeemCurrency),
                  state.poolCurrency?.displayName,
                  2
                )} available`}
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
          {hasPendingOrder ? <PendingOrder type="redeem" pool={pool} amount={pendingRedeem} /> : null}
          <ButtonGroup>
            {state.collectType && !claimDismissed ? (
              <Claim type="redeem" onDismiss={() => setClaimDismissed(true)} />
            ) : null}
            {preSubmitAction ? (
              <Button {...preSubmitAction} disabled={hasPendingOrder} type="submit">
                Redeem
              </Button>
            ) : (
              <Button
                type="submit"
                loading={isRedeeming}
                loadingMessage={loadingMessage}
                disabled={calculatingOrders || hasPendingOrder}
              >
                Redeem
              </Button>
            )}
          </ButtonGroup>
        </Stack>
      </Form>
    </FormikProvider>
  )
}
