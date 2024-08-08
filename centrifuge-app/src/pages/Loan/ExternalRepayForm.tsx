import { ActiveLoan, CurrencyBalance, ExternalLoan, findBalance, Price } from '@centrifuge/centrifuge-js'
import {
  useBalances,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text, Tooltip } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { copyable } from '../../components/Report/utils'
import { Tooltips } from '../../components/Tooltips'
import { Dec } from '../../utils/Decimal'
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

const UNLIMITED = Dec(1000000000000000)

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
  const utils = useCentrifugeUtils()

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

  const { maxAvailable, maxInterest, totalRepay, maxQuantity, principalAmount } = React.useMemo(() => {
    const outstandingInterest = 'outstandingInterest' in loan ? loan.outstandingInterest.toDecimal() : Dec(0)
    const { quantity, interest, price, amountAdditional } = repayForm.values
    const totalRepay = Dec(price || 0)
      .mul(quantity || 0)
      .add(interest || 0)
      .add(amountAdditional || 0)

    const principalAmount = Dec(price || 0).mul(quantity || 0)

    const maxInterest = outstandingInterest
    let maxQuantity = loan.pricing.outstandingQuantity
    let maxAvailable
    if (destination === 'reserve') {
      maxAvailable = balance
    } else {
      maxAvailable = UNLIMITED
    }

    return {
      maxAvailable,
      maxInterest,
      maxQuantity,
      totalRepay,
      principalAmount,
    }
  }, [loan, balance, repayForm.values])

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  return (
    <FormikProvider value={repayForm}>
      <Stack as={Form} gap={3} noValidate ref={repayFormRef}>
        <Stack gap={1}>
          <Shelf gap={1}>
            <Box flex={4}>
              <Field
                validate={combine(nonNegativeNumberNotRequired(), (val) => {
                  if (Dec(val || 0).gt(maxQuantity.toDecimal())) {
                    return `Quantity exeeds max (${maxQuantity.toString()})`
                  }
                  return ''
                })}
                name="quantity"
              >
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
                    />
                  )
                }}
              </Field>
            </Box>
            <Box flex={2}>
              <Field name="price">
                {({ field, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Price"
                      disabled={isRepayLoading}
                      onChange={(value) => form.setFieldValue('price', value)}
                      decimals={8}
                    />
                  )
                }}
              </Field>
            </Box>
            <Box flex={5}>
              <CurrencyInput
                label="Principal"
                disabled={true}
                currency={displayCurrency}
                value={principalAmount.toNumber()}
              />
            </Box>
          </Shelf>
        </Stack>

        {'outstandingInterest' in loan && loan.outstandingInterest.toDecimal().gt(0) && (
          <Field
            validate={combine(nonNegativeNumberNotRequired(), maxNotRequired(maxInterest.toNumber()))}
            name="interest"
          >
            {({ field, form }: FieldProps) => {
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

        {poolFees.render()}

        {destination === 'reserve' && totalRepay.gt(balance) && (
          <Box bg="statusCriticalBg" p={1}>
            <InlineFeedback status="critical">
              <Text color="statusCritical">
                The balance of the asset originator account ({formatBalance(balance, displayCurrency, 2)}) is
                insufficient. Transfer {formatBalance(totalRepay.sub(balance), displayCurrency, 2)} to{' '}
                {copyable(utils.formatAddress(account?.actingAddress || ''))} on Centrifuge.
              </Text>
            </InlineFeedback>
          </Box>
        )}
        {Dec(repayForm.values.quantity || 0).gt(maxQuantity.toDecimal()) && (
          <Box bg="statusCriticalBg" p={1}>
            <InlineFeedback status="critical">
              <Text color="statusCritical">
                Quantity ({repayForm.values.quantity}) is greater than the outstanding quantity (
                {maxQuantity.toDecimal().toString()}).
              </Text>
            </InlineFeedback>
          </Box>
        )}
        {Dec(repayForm.values.interest || 0).gt(maxInterest) && (
          <Box bg="statusCriticalBg" p={1}>
            <InlineFeedback status="critical">
              <Text color="statusCritical">
                Interest ({formatBalance(Dec(repayForm.values.interest || 0), displayCurrency, 2)}) is greater than the
                outstanding interest ({formatBalance(maxInterest, displayCurrency, 2)}).
              </Text>
            </InlineFeedback>
          </Box>
        )}

        <Stack p={2} maxWidth="444px" bg="backgroundTertiary" gap={2} mt={2}>
          <Text variant="heading4">Transaction summary</Text>
          <Shelf justifyContent="space-between">
            <Text variant="label2" color="textPrimary">
              Available balance
            </Text>
            <Text variant="label2">
              <Tooltip
                body={
                  maxAvailable === UNLIMITED
                    ? 'Unlimited because this is a virtual accounting process.'
                    : 'Balance of the asset originator account on Centrifuge'
                }
                style={{ pointerEvents: 'auto' }}
              >
                {maxAvailable === UNLIMITED ? 'No limit' : formatBalance(maxAvailable, displayCurrency, 2)}
              </Tooltip>
            </Text>
          </Shelf>

          <Stack gap={1}>
            <Shelf justifyContent="space-between">
              <Text variant="label2" color="textPrimary">
                Sale amount
              </Text>
              <Text variant="label2">{formatBalance(totalRepay, displayCurrency, 2)}</Text>
            </Shelf>
          </Stack>

          {poolFees.renderSummary()}

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
        </Stack>

        <Stack gap={1}>
          <Button
            type="submit"
            disabled={
              isRepayLoading ||
              !poolFees.isValid(repayForm) ||
              !repayForm.isValid ||
              totalRepay.greaterThan(maxAvailable) ||
              maxAvailable.eq(0) ||
              (destination === 'reserve' && balance.lt(totalRepay))
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
