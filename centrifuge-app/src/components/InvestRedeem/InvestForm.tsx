import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import {
  Box,
  Button,
  CurrencyInput,
  InlineFeedback,
  SelectInner,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
} from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePool } from '../../utils/usePools'
import { positiveNumber } from '../../utils/validation'
import { ButtonGroup } from '../ButtonGroup'
import { useDebugFlags } from '../DebugFlags'
import { Claim } from './Claim'
import { EpochBusy } from './EpochBusy'
import { useInvestRedeem } from './InvestRedeemProvider'
import { PendingOrder } from './PendingOrder'
import { inputToDecimal, inputToNumber, validateNumberInput } from './utils'

type InvestValues = {
  amount: number | ''
}

type InvestFormProps = {
  autoFocus?: boolean
  investLabel?: string
}

export function InvestForm({ autoFocus, investLabel = 'Invest' }: InvestFormProps) {
  const { state, actions, hooks } = useInvestRedeem()
  const [claimDismissed, setClaimDismissed] = React.useState(false)
  const { allowInvestBelowMin } = useDebugFlags()
  const pool = usePool(state.poolId)

  hooks.useActionSucceeded((action) => {
    if (action === 'approvePoolCurrency') {
      form.submitForm()
    } else {
      form.resetForm()
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
      } else if (hasPendingOrder && Dec(values.amount || 0).eq(pendingInvest)) {
        errors.amount = 'Equals current order'
      } else if (
        !allowInvestBelowMin &&
        state.isFirstInvestment &&
        Dec(values.amount || 0).lt(state.minInitialInvestment)
      ) {
        errors.amount = 'Investment amount too low'
      } else if (Dec(values.amount || 0).lt(state.minOrder)) {
        errors.amount = 'Order amount too low'
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

  const preSubmitAction = state.needsPoolCurrencyApproval(inputToNumber(form.values.amount))
    ? {
        onClick: () =>
          actions.approvePoolCurrency(CurrencyBalance.fromFloat(form.values.amount, state.poolCurrency!.decimals)),
        loading: isApproving,
      }
    : null

  return (
    <FormikProvider value={form}>
      <Form noValidate ref={formRef}>
        <Stack gap={2}>
          <EpochBusy busy={state.isPoolBusy} />
          {state.statusMessage && <InlineFeedback>{state.statusMessage}</InlineFeedback>}
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
                  currency={
                    state?.poolCurrencies.length > 1 ? (
                      <SelectInner
                        {...field}
                        onChange={(e) => {
                          actions.selectPoolCurrency(e.target.value)
                        }}
                        value={state.poolCurrency?.symbol}
                        options={state?.poolCurrencies.map((c) => ({ value: c.symbol, label: c.symbol }))}
                        style={{ textAlign: 'right' }}
                      />
                    ) : (
                      state.poolCurrency?.symbol
                    )
                  }
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

          {inputToNumber(form.values.amount) > 0 && (
            <Box p={2} backgroundColor="secondarySelectedBackground" borderRadius="input">
              <Text variant="body3">
                Token amount{' '}
                <TextWithPlaceholder isLoading={state.isDataLoading} fontWeight={600} width={12} variance={0}>
                  {!state.tokenPrice.isZero() &&
                    `~${formatBalance(Dec(form.values.amount).div(state.tokenPrice), state.trancheCurrency?.symbol)}`}
                </TextWithPlaceholder>
              </Text>
            </Box>
          )}
          <Shelf>
            {state.isFirstInvestment && (
              <InlineFeedback>
                All orders are being collected and will be executed by the issuer of the pool.
              </InlineFeedback>
            )}
          </Shelf>
          {hasPendingOrder ? (
            <Stack gap={2}>
              <PendingOrder type="invest" pool={pool} amount={pendingInvest} />
            </Stack>
          ) : null}
          <ButtonGroup>
            {!!preSubmitAction ? (
              <Button {...preSubmitAction}>{investLabel}</Button>
            ) : state.canChangeOrder && hasPendingOrder ? (
              <Button onClick={form.submitForm} disabled={isCancelling || pool.epoch.status !== 'ongoing'}>
                Change order
              </Button>
            ) : (
              <Button
                type="submit"
                loading={isInvesting}
                loadingMessage={loadingMessage}
                disabled={state.isPoolBusy || nativeBalanceTooLow}
              >
                {investLabel}
              </Button>
            )}
            {state.collectType && !claimDismissed ? (
              <Claim type="invest" onDismiss={() => setClaimDismissed(true)} />
            ) : null}
            {state.canCancelOrder && (
              <Button
                onClick={() => actions.cancelInvest()}
                loading={isCancelling}
                disabled={pool.epoch.status !== 'ongoing'}
                variant="secondary"
              >
                Cancel
              </Button>
            )}
          </ButtonGroup>
        </Stack>
      </Form>
    </FormikProvider>
  )
}
