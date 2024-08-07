import { ActiveLoan, CurrencyBalance, ExternalLoan, findBalance, Price } from '@centrifuge/centrifuge-js'
import {
  roundDown,
  useBalances,
  useCentrifugeTransaction,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { copyable } from '../../components/Report/utils'
import { Tooltips } from '../../components/Tooltips'
import { Dec, max as maxDec, min } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useLoans } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxNotRequired, nonNegativeNumberNotRequired } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'

type RepayValues = {
  price: number | '' | Decimal
  interest: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  quantity: number | ''
  fees: { id: string; amount: number | '' | Decimal }[]
}
/**
 * Repay form for loans with `valuationMethod === oracle
 */
export function ExternalRepayForm({ loan, destination }: { loan: ExternalLoan; destination: string }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account?.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const loans = useLoans(loan.poolId)
  const destinationLoan = loans?.find((l) => l.id === destination) as ActiveLoan
  const displayCurrency = destination === 'reserve' ? pool.currency.symbol : 'USD'

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Sell asset',
    (cent) =>
      (
        args: [quantity: Price, interest: CurrencyBalance, amountAdditional: CurrencyBalance, price: CurrencyBalance],
        options
      ) => {
        const [quantity, interest, amountAdditional, price] = args
        if (!account) throw new Error('No borrower')
        let repayTx
        if (destination === 'reserve') {
          repayTx = cent.pools.repayExternalLoanPartially(
            [pool.id, loan.id, quantity, interest, amountAdditional, price],
            {
              batch: true,
            }
          )
        } else {
          const repay = { quantity, price, interest, unscheduled: amountAdditional }
          const principal = new CurrencyBalance(
            price.mul(new BN(quantity.toDecimal().toString())),
            pool.currency.decimals
          )
          let borrow = {
            amount: new CurrencyBalance(
              principal.add(interest).add(amountAdditional).toString(),
              pool.currency.decimals
            ),
          }
          repayTx = cent.pools.transferLoanDebt([pool.id, loan.id, destinationLoan.id, repay, borrow], { batch: true })
        }
        return combineLatest([cent.getApi(), repayTx, poolFees.getBatch(repayForm)]).pipe(
          switchMap(([api, repayTx, batch]) => {
            let tx = wrapProxyCallsForAccount(api, repayTx, account, 'Borrow')
            if (batch.length) {
              tx = api.tx.utility.batchAll([tx, ...batch])
            }
            return cent.wrapSignAndSend(api, tx, { ...options, proxies: undefined })
          })
        )
      },
    {
      onSuccess: () => {
        repayForm.resetForm()
      },
    }
  )

  const currentFace =
    loan?.pricing && 'outstandingQuantity' in loan.pricing
      ? loan.pricing.outstandingQuantity.toDecimal().mul(loan.pricing.notional.toDecimal())
      : null

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      price: '',
      quantity: '',
      fees: [],
      interest: '',
      amountAdditional: '',
    },
    onSubmit: (values, actions) => {
      const price = CurrencyBalance.fromFloat(values.price || 0, pool.currency.decimals)
      const interest = CurrencyBalance.fromFloat(values?.interest || 0, pool.currency.decimals)
      const amountAdditional = CurrencyBalance.fromFloat(values.amountAdditional || 0, pool.currency.decimals)
      const quantity = Price.fromFloat(values.quantity || 0)

      doRepayTransaction([quantity, interest, amountAdditional, price], {
        account,
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  const debt = ('outstandingDebt' in loan && loan.outstandingDebt?.toDecimal()) || Dec(0)
  const { maxAvailable, maxInterest, totalRepay } = React.useMemo(() => {
    const outstandingInterest = 'outstandingInterest' in loan ? loan.outstandingInterest.toDecimal() : Dec(0)
    const outstandingDebt = 'outstandingDebt' in loan ? loan.outstandingDebt.toDecimal() : Dec(0)
    const { quantity, interest, amountAdditional, price } = repayForm.values
    const totalRepay = Dec(price || 0)
      .mul(quantity || 0)
      .add(interest || 0)
      .add(amountAdditional || 0)
    let maxAvailable = min(balance, debt)
    let maxInterest = min(balance, outstandingInterest)
    if (destination !== 'reserve') {
      maxAvailable = outstandingDebt
      maxInterest = outstandingInterest
    }
    return {
      maxAvailable,
      maxInterest: maxDec(
        min(maxInterest, maxAvailable.sub(Dec(price || 0).mul(quantity || 0) || 0).sub(amountAdditional || 0)),
        Dec(0)
      ),
      totalRepay,
    }
  }, [loan, balance, repayForm.values])

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  return (
    <FormikProvider value={repayForm}>
      <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
        <Shelf gap={1}>
          <Field validate={combine(nonNegativeNumberNotRequired())} name="quantity">
            {({ field, form }: FieldProps) => {
              return (
                <CurrencyInput
                  {...field}
                  label="Quantity"
                  disabled={isRepayLoading}
                  onChange={(value) => form.setFieldValue('quantity', value)}
                  placeholder="0"
                  onSetMax={() =>
                    form.setFieldValue('quantity', loan.pricing.outstandingQuantity.toDecimal().toNumber())
                  }
                  secondaryLabel={`${loan.pricing.outstandingQuantity.toDecimal().toString()} outstanding`}
                />
              )
            }}
          </Field>
          <Field
            validate={combine(
              nonNegativeNumberNotRequired(),
              maxNotRequired(
                maxAvailable.toNumber(),
                `Quantity x price (${formatBalance(
                  Dec(repayForm.values.price || 0).mul(repayForm.values.quantity || 0),
                  displayCurrency
                )}) exceeds available debt (${formatBalance(maxAvailable, displayCurrency)})`
              )
            )}
            name="price"
          >
            {({ field, form }: FieldProps) => {
              return (
                <CurrencyInput
                  {...field}
                  label="Settlement price"
                  disabled={isRepayLoading}
                  currency={displayCurrency}
                  onChange={(value) => form.setFieldValue('price', value)}
                  decimals={8}
                  secondaryLabel={'\u200B'} // zero width space
                />
              )
            }}
          </Field>
        </Shelf>
        {'outstandingInterest' in loan && loan.outstandingInterest.toDecimal().gt(0) && (
          <Field
            validate={combine(nonNegativeNumberNotRequired(), maxNotRequired(maxInterest.toNumber()))}
            name="interest"
          >
            {({ field, meta, form }: FieldProps) => {
              return (
                <CurrencyInput
                  {...field}
                  value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                  label="Interest"
                  secondaryLabel={`${formatBalance(loan.outstandingInterest, displayCurrency, 2)} interest accrued`}
                  disabled={isRepayLoading}
                  currency={displayCurrency}
                  onChange={(value) => form.setFieldValue('interest', value)}
                  onSetMax={() => form.setFieldValue('interest', maxInterest.toNumber())}
                />
              )
            }}
          </Field>
        )}
        <Field
          name="amountAdditional"
          validate={combine(nonNegativeNumberNotRequired(), maxNotRequired(maxAvailable.toNumber()))}
        >
          {({ field, form }: FieldProps) => {
            return (
              <CurrencyInput
                {...field}
                value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                label={<Tooltips type="additionalAmountInput" />}
                disabled={isRepayLoading}
                currency={displayCurrency}
                onChange={(value) => form.setFieldValue('amountAdditional', value)}
              />
            )
          }}
        </Field>
        <Box bg="statusDefaultBg" p={1}>
          {destination === 'reserve' ? (
            <InlineFeedback status="default">
              <Text color="statusDefault">Stablecoins will be transferred to the onchain reserve.</Text>
            </InlineFeedback>
          ) : (
            <InlineFeedback status="default">
              <Text color="statusDefault">
                Virtual accounting process. No onchain stablecoin transfers are expected.
              </Text>
            </InlineFeedback>
          )}
        </Box>
        {poolFees.render()}
        <Stack gap={1}>
          <Shelf justifyContent="space-between">
            <Text variant="emphasized">Total amount</Text>
            <Text variant="emphasized">{formatBalance(totalRepay, displayCurrency, 2)}</Text>
          </Shelf>

          {poolFees.renderSummary()}

          <Shelf justifyContent="space-between">
            <Text variant="emphasized">Available</Text>
            <Text variant="emphasized">{formatBalance(maxAvailable, displayCurrency, 2)}</Text>
          </Shelf>
        </Stack>
        {destination === 'reserve' && totalRepay.gt(balance) && destination === 'reserve' && (
          <Box bg="statusCriticalBg" p={1}>
            <InlineFeedback status="critical">
              <Text color="statusCritical">
                The balance of the asset originator account ({formatBalance(balance, displayCurrency, 2)}) is
                insufficient. Transfer {formatBalance(totalRepay.sub(balance), displayCurrency, 2)} to{' '}
                {copyable(account?.actingAddress || '')} on Centrifuge.
              </Text>
            </InlineFeedback>
          </Box>
        )}
        {totalRepay.gt(maxAvailable) && (
          <Box bg="statusCriticalBg" p={1}>
            <InlineFeedback status="critical">
              <Text color="statusCritical">
                The amount ({formatBalance(roundDown(totalRepay), displayCurrency, 2)}) is greater than the available
                debt ({formatBalance(maxAvailable, displayCurrency, 2)}).
              </Text>
            </InlineFeedback>
          </Box>
        )}
        <Stack gap={1}>
          <Button
            type="submit"
            disabled={
              isRepayLoading ||
              !poolFees.isValid(repayForm) ||
              !repayForm.isValid ||
              totalRepay.greaterThan(maxAvailable) ||
              maxAvailable.eq(0)
            }
            loading={isRepayLoading}
          >
            Sell
          </Button>
        </Stack>
      </Stack>
    </FormikProvider>
  )
}
