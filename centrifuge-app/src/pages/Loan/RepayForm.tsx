import {
  ActiveLoan,
  CreatedLoan,
  CurrencyBalance,
  ExternalLoan,
  findBalance,
  Loan,
  Rate,
} from '@centrifuge/centrifuge-js'
import {
  useBalances,
  useCentrifugeApi,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  CurrencyInput,
  IconCheckCircle,
  IconClock,
  InlineFeedback,
  Select,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
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
import {
  combine,
  maxNotRequired,
  nonNegativeNumberNotRequired,
  positiveNumberNotRequired,
} from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { ErrorMessage } from './ErrorMessage'
import { StyledSuccessButton } from './ExternalFinanceForm'
import { ExternalRepayForm } from './ExternalRepayForm'
import { SourceSelect } from './SourceSelect'
import { isCashLoan, isExternalLoan } from './utils'

export type RepayValues = {
  principal: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  interest: number | '' | Decimal
  fees: { id: string; amount: number | '' | Decimal }[]
  category: 'correction' | 'miscellaneous' | 'tax' | undefined
}

const UNLIMITED = Dec(1000000000000000)

export function RepayForm({ loan }: { loan: CreatedLoan | ActiveLoan }) {
  const [destination, setDestination] = React.useState<string>('reserve')

  if (isExternalLoan(loan)) {
    return (
      <Stack gap={2} p={1}>
        <Text variant="heading2">Sell</Text>
        <ExternalRepayForm loan={loan as ExternalLoan} destination={destination} setDestination={setDestination} />
      </Stack>
    )
  }

  return (
    <Stack gap={2} p={1}>
      <Text variant="heading2">{isCashLoan(loan) ? 'Withdraw' : 'Repay'}</Text>
      <InternalRepayForm loan={loan} destination={destination} setDestination={setDestination} />
    </Stack>
  )
}
/**
 * Repay form for loans with `valuationMethod: outstandingDebt, discountedCashflow, cash`
 */
function InternalRepayForm({
  loan,
  destination,
  setDestination,
}: {
  loan: ActiveLoan | CreatedLoan
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
  const api = useCentrifugeApi()
  const destinationLoan = loans?.find((l) => l.id === destination) as Loan
  const displayCurrency = destination === 'reserve' ? pool.currency.symbol : 'USD'
  const utils = useCentrifugeUtils()
  const [transactionSuccess, setTransactionSuccess] = React.useState(false)

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    isCashLoan(loan) ? 'Withdraw funds' : 'Repay asset',
    (cent) =>
      (args: [principal: CurrencyBalance, interest: CurrencyBalance, amountAdditional: CurrencyBalance], options) => {
        const [principal, interest, amountAdditional] = args
        if (!account) throw new Error('No borrower')
        let repayTx
        if (destination === 'reserve') {
          repayTx = cent.pools.repayLoanPartially([pool.id, loan.id, principal, interest, amountAdditional], {
            batch: true,
          })
        } else if (destination === 'other') {
          if (!repayForm.values.category) throw new Error('No category selected')
          const decreaseDebtTx = api.tx.loans.decreaseDebt(pool.id, loan.id, {
            principal: { internal: principal.toString() },
            interest: 0,
            unscheduled: 0,
          })
          const encoded = new TextEncoder().encode(repayForm.values.category)
          const categoryHex = Array.from(encoded)
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('')
          repayTx = cent.remark.remark([[{ Named: categoryHex }], decreaseDebtTx], { batch: true })
        } else {
          const repay = { principal, interest, unscheduled: amountAdditional }
          const borrowAmount = new CurrencyBalance(
            principal.add(interest).add(amountAdditional),
            pool.currency.decimals
          )
          let borrow = { amount: borrowAmount }
          repayTx = cent.pools.transferLoanDebt([pool.id, loan.id, destinationLoan.id, repay, borrow], { batch: true })
        }
        return combineLatest([repayTx, poolFees.getBatch(repayForm)]).pipe(
          switchMap(([repayTx, batch]) => {
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
        setTransactionSuccess(true)
      },
    }
  )

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      principal: '',
      amountAdditional: '',
      interest: '',
      fees: [],
      category: 'correction',
    },
    onSubmit: (values, actions) => {
      let interest = CurrencyBalance.fromFloat(values.interest || 0, pool.currency.decimals)
      const additionalAmount = CurrencyBalance.fromFloat(values.amountAdditional || 0, pool.currency.decimals)
      const principal = CurrencyBalance.fromFloat(values.principal || 0, pool.currency.decimals)

      if (interest.toDecimal().eq(maxInterest) && principal.toDecimal().eq(maxPrincipal)) {
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

      doRepayTransaction([principal, interest, additionalAmount], {
        account,
        forceProxyType: 'Borrow',
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

  const { maxAvailable, maxPrincipal, maxInterest, totalRepay } = React.useMemo(() => {
    const { interest, principal, amountAdditional } = repayForm.values
    const outstandingInterest = 'outstandingInterest' in loan ? loan.outstandingInterest.toDecimal() : Dec(0)
    let maxAvailable
    let maxPrincipal
    let maxInterest
    if (destination === 'reserve') {
      maxAvailable = balance
      maxPrincipal = loan.outstandingDebt.toDecimal().sub(outstandingInterest)
      maxInterest = outstandingInterest
    } else if (destination === 'other') {
      maxAvailable = UNLIMITED
      maxPrincipal = loan.outstandingDebt.toDecimal().sub(outstandingInterest)
      maxInterest = Dec(0)
    } else {
      maxAvailable = UNLIMITED
      maxPrincipal = loan.outstandingDebt.toDecimal().sub(outstandingInterest)
      maxInterest = outstandingInterest
    }
    const totalRepay = Dec(principal || 0)
      .add(Dec(interest || 0))
      .add(Dec(amountAdditional || 0))
    return {
      maxAvailable,
      maxPrincipal,
      maxInterest,
      totalRepay,
    }
  }, [loan, balance, repayForm.values, destination])

  return (
    <>
      <FormikProvider value={repayForm}>
        <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
          <Box
            px={3}
            py={2}
            backgroundColor={theme.colors.backgroundSecondary}
            borderRadius={10}
            border={`1px solid ${theme.colors.borderPrimary}`}
          >
            <Stack gap={2}>
              <SourceSelect loan={loan} value={destination} onChange={setDestination} action="repay" />
              <Field
                validate={combine(
                  positiveNumberNotRequired(),
                  maxNotRequired(maxPrincipal.toNumber(), 'Principal exceeds available debt')
                )}
                name="principal"
              >
                {({ field, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                      label={isCashLoan(loan) ? 'Amount' : 'Principal'}
                      disabled={isRepayLoading}
                      currency={displayCurrency}
                      onChange={(value) => form.setFieldValue('principal', value)}
                      onSetMax={() => {
                        form.setFieldValue('principal', maxPrincipal.gte(0) ? maxPrincipal : 0)
                      }}
                      secondaryLabel={`${formatBalance(maxPrincipal, displayCurrency)} outstanding`}
                    />
                  )
                }}
              </Field>
              {'outstandingInterest' in loan && loan.outstandingInterest.toDecimal().gt(0) && !isCashLoan(loan) && (
                <Field
                  validate={combine(
                    positiveNumberNotRequired(),
                    maxNotRequired(maxInterest.toNumber(), 'Interest exceeds available debt')
                  )}
                  name="interest"
                >
                  {({ field, form }: FieldProps) => {
                    return (
                      <CurrencyInput
                        {...field}
                        value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                        label="Interest"
                        secondaryLabel={`${formatBalance(
                          loan.outstandingInterest,
                          displayCurrency,
                          2
                        )} interest accrued`}
                        disabled={isRepayLoading}
                        currency={displayCurrency}
                        onChange={(value) => form.setFieldValue('interest', value)}
                        onSetMax={() => form.setFieldValue('interest', maxInterest.gte(0) ? maxInterest : 0)}
                      />
                    )
                  }}
                </Field>
              )}
              {!isCashLoan(loan) && (
                <Field
                  name="amountAdditional"
                  validate={combine(
                    nonNegativeNumberNotRequired(),
                    maxNotRequired(maxAvailable.toNumber(), 'Additional amount exceeds available debt')
                  )}
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
              )}
              {destination === 'other' && (
                <Field name="category">
                  {({ field }: FieldProps) => {
                    return (
                      <Select
                        options={[
                          { label: 'Correction', value: 'correction' },
                          { label: 'Tax', value: 'tax' },
                          { label: 'Miscellaneous', value: 'miscellaneous' },
                        ]}
                        label="Category"
                        {...field}
                      />
                    )
                  }}
                </Field>
              )}
              {poolFees.render()}

              <ErrorMessage type="critical" condition={Dec(repayForm.values.principal || 0).gt(maxPrincipal)}>
                {isCashLoan(loan) ? 'Amount' : 'Principal'} (
                {formatBalance(Dec(repayForm.values.principal || 0), displayCurrency, 2)}) is greater than the
                outstanding {isCashLoan(loan) ? 'balance' : 'principal'} (
                {formatBalance(maxPrincipal, displayCurrency, 2)}).
              </ErrorMessage>

              <ErrorMessage type="critical" condition={Dec(repayForm.values.interest || 0).gt(maxInterest)}>
                Interest ({formatBalance(Dec(repayForm.values.interest || 0), displayCurrency, 2)}) is greater than the
                outstanding interest ({formatBalance(maxInterest, displayCurrency, 2)}).
              </ErrorMessage>

              <ErrorMessage type="critical" condition={destination === 'reserve' && totalRepay.gt(balance)}>
                The balance of the asset originator account ({formatBalance(balance, displayCurrency, 2)}) is
                insufficient. Transfer {formatBalance(totalRepay.sub(balance), displayCurrency, 2)} to{' '}
                {copyable(utils.formatAddress(account?.actingAddress || ''))} on Centrifuge.
              </ErrorMessage>
            </Stack>
          </Box>

          <Stack gap={2} mt={2} border={`1px solid ${theme.colors.borderPrimary}`} px={3} py={2} borderRadius={10}>
            <Text variant="heading4">Transaction summary</Text>
            <Box paddingX={2} mt={2}>
              <Stack gap={1}>
                <Shelf justifyContent="space-between">
                  <Tooltips
                    type={
                      maxAvailable === UNLIMITED ? 'repayFormAvailableBalanceUnlimited' : 'repayFormAvailableBalance'
                    }
                    size="med"
                  />
                  <Text variant="body2">
                    {maxAvailable === UNLIMITED ? 'No limit' : formatBalance(maxAvailable, displayCurrency, 2)}
                  </Text>
                </Shelf>

                <Stack gap={1}>
                  <Shelf justifyContent="space-between">
                    <Text variant="body2" color="textSecondary">
                      {isCashLoan(loan) ? 'Withdrawal amount' : 'Repayment amount'}
                    </Text>
                    <Text variant="body2">{formatBalance(totalRepay, displayCurrency, 2)}</Text>
                  </Shelf>
                </Stack>

                {poolFees.renderSummary()}
              </Stack>

              <Stack mt={3}>
                {destination === 'reserve' ? (
                  <InlineFeedback status="default">
                    <Text variant="body2" color="statusDefault">
                      Stablecoins will be transferred to the onchain reserve.
                    </Text>
                  </InlineFeedback>
                ) : destination === 'other' ? (
                  <InlineFeedback status="default">
                    <Text variant="body2" color="statusDefault">
                      Virtual accounting process. No onchain stablecoin transfers are expected. This action will lead to
                      a decrease in the NAV of the pool.
                    </Text>
                  </InlineFeedback>
                ) : (
                  <InlineFeedback status="default">
                    <Text variant="body2" color="statusDefault">
                      Virtual accounting process. No onchain stablecoin transfers are expected.
                    </Text>
                  </InlineFeedback>
                )}
              </Stack>
            </Box>
          </Stack>

          <Stack gap={1}>
            {transactionSuccess ? (
              <StyledSuccessButton icon={<IconCheckCircle size={24} />}>Transaction successful</StyledSuccessButton>
            ) : (
              <Button
                type="submit"
                disabled={
                  !poolFees.isValid(repayForm) ||
                  !repayForm.isValid ||
                  maxAvailable.eq(0) ||
                  (destination === 'reserve' && balance.lt(totalRepay))
                }
                icon={isRepayLoading ? <IconClock size={24} /> : undefined}
              >
                {isRepayLoading ? 'Transaction Pending' : isCashLoan(loan) ? 'Withdraw' : 'Repay'}
              </Button>
            )}
          </Stack>
        </Stack>
      </FormikProvider>
    </>
  )
}
