import { ActiveLoan, CurrencyBalance, ExternalLoan, findBalance, Price, Rate } from '@centrifuge/centrifuge-js'
import {
  useBalances,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { useTheme } from 'styled-components'
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
import { ErrorMessage } from './ErrorMessage'
import { SourceSelect } from './SourceSelect'

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
export function ExternalRepayForm({
  loan,
  destination,
  setDestination,
}: {
  loan: ExternalLoan
  destination: string
  setDestination: (destination: string) => void
}) {
  const theme = useTheme()
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
      let interest = CurrencyBalance.fromFloat(values?.interest || 0, pool.currency.decimals)
      const amountAdditional = CurrencyBalance.fromFloat(values.amountAdditional || 0, pool.currency.decimals)
      const quantity = Price.fromFloat(values.quantity || 0)

      if (interest.toDecimal().eq(maxInterest) && quantity.toDecimal().eq(maxQuantity.toDecimal())) {
        const outstandingInterest =
          'outstandingInterest' in loan
            ? loan.outstandingInterest
            : CurrencyBalance.fromFloat(0, pool.currency.decimals)
        const outstandingPrincipal =
          'outstandingPrincipal' in loan
            ? loan.outstandingPrincipal
            : CurrencyBalance.fromFloat(0, pool.currency.decimals)

        const fiveMinuteBuffer = 5 * 60
        const time = Date.now() + fiveMinuteBuffer - loan.fetchedAt.getTime()
        const mostUpToDateInterest = CurrencyBalance.fromFloat(
          outstandingPrincipal
            .toDecimal()
            .mul(Rate.fractionFromAprPercent(loan.pricing.interestRate.toDecimal()).toDecimal())
            .mul(time)
            .add(outstandingInterest.toDecimal()),
          pool.currency.decimals
        )
        interest = mostUpToDateInterest
        console.log(
          `Repaying with interest including buffer ${mostUpToDateInterest.toDecimal()} instead of ${outstandingInterest.toDecimal()}`,
          loan.pricing.interestRate.toDecimal().toString()
        )
      }

      doRepayTransaction([quantity, interest, amountAdditional, price], {
        account,
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  React.useEffect(() => {
    repayForm.validateForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination])

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  const { maxAvailable, maxInterest, totalRepay, maxQuantity, principal } = React.useMemo(() => {
    const outstandingInterest = 'outstandingInterest' in loan ? loan.outstandingInterest.toDecimal() : Dec(0)
    const { quantity, interest, price, amountAdditional } = repayForm.values
    const totalRepay = Dec(price || 0)
      .mul(quantity || 0)
      .add(interest || 0)
      .add(amountAdditional || 0)

    const principal = Dec(price || 0).mul(quantity || 0)

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
      principal,
    }
  }, [loan, balance, repayForm.values, destination])

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  return (
    <FormikProvider value={repayForm}>
      <Stack as={Form} gap={3} noValidate ref={repayFormRef}>
        <Box
          px={3}
          py={2}
          backgroundColor={theme.colors.backgroundSecondary}
          borderRadius={10}
          border={`1px solid ${theme.colors.borderPrimary}`}
        >
          <Stack gap={2}>
            <SourceSelect loan={loan} value={destination} onChange={setDestination} action="repay" />
            <Shelf gap={2}>
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
              <Field name="price">
                {({ field, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Price"
                      disabled={isRepayLoading}
                      onChange={(value) => form.setFieldValue('price', value)}
                      decimals={8}
                      currency={displayCurrency}
                    />
                  )
                }}
              </Field>
            </Shelf>
            <Shelf justifyContent="flex-end">
              <Text variant="body2" color="textPrimary">
                = {formatBalance(principal, displayCurrency, 2)} principal
              </Text>
            </Shelf>
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
                    label="Additional amount"
                    disabled={isRepayLoading}
                    currency={displayCurrency}
                    onChange={(value) => form.setFieldValue('amountAdditional', value)}
                  />
                )
              }}
            </Field>

            {poolFees.render()}
          </Stack>
        </Box>

        <ErrorMessage type="critical" condition={destination === 'reserve' && totalRepay.gt(balance)}>
          The balance of the asset originator account ({formatBalance(balance, displayCurrency, 2)}) is insufficient.
          Transfer {formatBalance(totalRepay.sub(balance), displayCurrency, 2)} to{' '}
          {copyable(utils.formatAddress(account?.actingAddress || ''))} on Centrifuge.
        </ErrorMessage>

        <ErrorMessage type="critical" condition={Dec(repayForm.values.quantity || 0).gt(maxQuantity.toDecimal())}>
          Quantity ({repayForm.values.quantity}) is greater than the outstanding quantity (
          {maxQuantity.toDecimal().toString()}).
        </ErrorMessage>

        <ErrorMessage type="critical" condition={Dec(repayForm.values.interest || 0).gt(maxInterest)}>
          Interest ({formatBalance(Dec(repayForm.values.interest || 0), displayCurrency, 2)}) is greater than the
          outstanding interest ({formatBalance(maxInterest, displayCurrency, 2)}).
        </ErrorMessage>

        <Stack gap={2} mt={2} border={`1px solid ${theme.colors.borderPrimary}`} px={3} py={2} borderRadius={10}>
          <Stack gap={1} mb={2}>
            <Text variant="heading4">Transaction summary</Text>
            <Box paddingX={2} mt={2}>
              <Shelf justifyContent="space-between">
                <Tooltips
                  type={maxAvailable === UNLIMITED ? 'repayFormAvailableBalanceUnlimited' : 'repayFormAvailableBalance'}
                  size="med"
                />
                <Text variant="body2">
                  {maxAvailable === UNLIMITED ? 'No limit' : formatBalance(maxAvailable, displayCurrency, 2)}
                </Text>
              </Shelf>

              <Stack gap={1}>
                <Shelf justifyContent="space-between">
                  <Text variant="body2" color="textSecondary">
                    Sale amount
                  </Text>
                  <Text variant="body2">{formatBalance(totalRepay, displayCurrency, 2)}</Text>
                </Shelf>
              </Stack>

              {poolFees.renderSummary()}
            </Box>
          </Stack>

          <Box paddingX={2}>
            {destination === 'reserve' ? (
              <InlineFeedback status="default">
                <Text variant="body2" color="statusDefault">
                  Stablecoins will be transferred to the onchain reserve.
                </Text>
              </InlineFeedback>
            ) : (
              <InlineFeedback status="default">
                <Text variant="body2" color="statusDefault">
                  Virtual accounting process. No onchain stablecoin transfers are expected.
                </Text>
              </InlineFeedback>
            )}
          </Box>
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
