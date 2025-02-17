import { Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { Box, Button, CurrencyInput, Stack, Text } from '@centrifuge/fabric'
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
  const hasPendingOrder = pendingRedeem.greaterThan(1)

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
      const amountTokens = values.amount instanceof Decimal ? values.amount : Dec(values.amount || 0)
      actions.redeem(TokenBalance.fromFloat(amountTokens, state.trancheCurrency?.decimals ?? 18))
      formActions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<RedeemValues> = {}
      const amountTokens = values.amount instanceof Decimal ? values.amount : Dec(values.amount || 0)
      if (validateNumberInput(amountTokens, 0, maxRedeemTokens)) {
        errors.amount = validateNumberInput(amountTokens, 0, maxRedeemTokens)
      } else if (hasPendingOrder && amountTokens.eq(pendingRedeem)) {
        errors.amount = 'Equals current order'
      } else if (amountTokens.lt(state.minOrder)) {
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
  const isPreAction = state.pendingAction === 'preAction' && isPending

  const preSubmitAction = state.needsPreAction('redeem')
    ? {
        onClick: () => actions.preAction('redeem'),
        loading: isPreAction,
        label: state.needsPreAction('redeem'),
      }
    : state.needsTrancheTokenApproval(inputToNumber(form.values.amount))
    ? {
        onClick: () =>
          actions.approveTrancheToken(TokenBalance.fromFloat(form.values.amount, state.trancheCurrency!.decimals)),
        loading: isApproving,
      }
    : null

  return (
    <FormikProvider value={form}>
      <Form noValidate ref={formRef}>
        <Stack gap={2}>
          <EpochBusy busy={calculatingOrders} />
          {(!state.collectType || claimDismissed) && (state.canChangeOrder || !hasPendingOrder) ? (
            <>
              <Field name="amount" validate={positiveNumber()}>
                {({ field, meta }: FieldProps) => (
                  <CurrencyInput
                    {...field}
                    value={field.value}
                    errorMessage={meta.touched && (field.value !== 0 || form.submitCount > 0) ? meta.error : undefined}
                    label="Amount"
                    disabled={isRedeeming}
                    onSetMax={() => form.setFieldValue('amount', state.trancheBalanceWithPending)}
                    onChange={(value) => form.setFieldValue('amount', value)}
                    currency={state.trancheCurrency?.displayName}
                    secondaryLabel={`${formatBalance(
                      roundDown(maxRedeemTokens),
                      state.trancheCurrency?.displayName,
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
                            : Dec(form.values.amount).mul(state.tokenPrice),
                          state.poolCurrency?.displayName
                        )}`}
                    </Text>
                  </Text>
                </Box>
              )}
            </>
          ) : null}
          {hasPendingOrder ? <PendingOrder type="redeem" pool={pool} amount={pendingRedeem} /> : null}
          <ButtonGroup>
            {state.collectType && !claimDismissed ? (
              <Claim type="redeem" onDismiss={() => setClaimDismissed(true)} />
            ) : null}
            {!!preSubmitAction ? (
              <Button {...preSubmitAction} type="submit" variant="secondary">
                Redeem
              </Button>
            ) : !state.collectType || claimDismissed ? (
              <Button
                variant="secondary"
                type="submit"
                loading={isRedeeming}
                loadingMessage={loadingMessage}
                disabled={calculatingOrders || hasPendingOrder}
              >
                Redeem
              </Button>
            ) : null}
          </ButtonGroup>
        </Stack>
      </Form>
    </FormikProvider>
  )
}
