import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePool } from '../../utils/usePools'
import { positiveNumber } from '../../utils/validation'
import { useDebugFlags } from '../DebugFlags'
import { EpochBusy } from './EpochBusy'
import { useInvestRedeem } from './InvestRedeemProvider'
import { PendingOrder } from './PendingOrder'
import { InvestValues } from './types'
import { inputToDecimal, inputToNumber, validateNumberInput } from './utils'

type InvestFormProps = {
  onCancel?: () => void
  hasInvestment?: boolean
  autoFocus?: boolean
  investLabel?: string
}

export function InvestForm({ onCancel, hasInvestment, autoFocus, investLabel = 'Invest' }: InvestFormProps) {
  const { state, actions, hooks } = useInvestRedeem()
  const [changeOrderFormShown, setChangeOrderFormShown] = React.useState(false)
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

  function renderInput(cancelCb?: () => void, preSubmitAction?: { onClick: () => void; loading?: boolean }) {
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
                errorMessage={meta.touched && (field.value !== 0 || form.submitCount > 0) ? meta.error : undefined}
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
          {preSubmitAction ? (
            <Button {...preSubmitAction}>{investLabel}</Button>
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
          renderInput(onCancel, { onClick: actions.approvePoolCurrency, loading: isApproving })
        ) : (
          renderInput(onCancel)
        )}
      </Form>
    </FormikProvider>
  )
}
