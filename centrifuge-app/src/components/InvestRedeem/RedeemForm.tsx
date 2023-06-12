import { Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePool } from '../../utils/usePools'
import { positiveNumber } from '../../utils/validation'
import { EpochBusy } from './EpochBusy'
import { useInvestRedeem } from './InvestRedeemProvider'
import { PendingOrder } from './PendingOrder'
import { InvestValues } from './types'
import { inputToNumber, validateNumberInput } from './utils'

type RedeemFormProps = {
  onCancel: () => void
  autoFocus?: boolean
}

export function RedeemForm({ onCancel, autoFocus }: RedeemFormProps) {
  const { state, actions, hooks } = useInvestRedeem()
  const pool = usePool(state.poolId) as Pool
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)

  const pendingRedeem = state.order?.remainingRedeemToken ?? Dec(0)

  const maxRedeem = state.trancheBalanceWithPending.mul(state.tokenPrice)
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
  const isRedeeming = state.pendingAction === 'redeem' && isPending
  const isCancelling = state.pendingAction === 'cancelRedeem' && isPending
  const isApproving = state.pendingAction === 'approveTrancheToken' && isPending
  const isCollecting = state.pendingAction === 'collect' && isPending

  const calculatingOrders = pool.epoch.status !== 'ongoing'

  function renderInput(cancelCb?: () => void, preSubmitAction?: { onClick: () => void; loading?: boolean }) {
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
              errorMessage={meta.touched && (field.value !== 0 || form.submitCount > 0) ? meta.error : undefined}
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
          renderInput(onCancel, { onClick: actions.approveTrancheToken, loading: isApproving })
        ) : (
          renderInput(onCancel)
        )}
      </Form>
    </FormikProvider>
  )
}
