import { ActiveLoan, CurrencyBalance, ExternalLoan, findBalance } from '@centrifuge/centrifuge-js'
import {
  useBalances,
  useCentrifugeApi,
  useCentrifugeTransaction,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, InlineFeedback, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { Dec, max as maxDec, min } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
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
import { ExternalRepayForm } from './ExternalRepayForm'
import { SourceSelect } from './SourceSelect'
import { isCashLoan, isExternalLoan } from './utils'

export type RepayValues = {
  principal: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  interest: number | '' | Decimal
  fees: { id: string; amount: number | '' | Decimal }[]
  category: 'correction' | 'miscellaneous' | undefined
}

const UNLIMITED = Dec(1000000000000000)

export function RepayForm({ loan }: { loan: ActiveLoan }) {
  const [destination, setDestination] = React.useState<string>('reserve')

  if (isExternalLoan(loan)) {
    return (
      <Stack gap={2} p={1}>
        <Text variant="heading2">Sell</Text>
        <SourceSelect loan={loan} value={destination} onChange={setDestination} action="repay" />
        <ExternalRepayForm loan={loan as ExternalLoan} destination={destination} />
      </Stack>
    )
  }

  return (
    <Stack gap={2} p={1}>
      <Text variant="heading2">{isCashLoan(loan) ? 'Withdraw' : 'Repay'}</Text>
      <SourceSelect loan={loan} value={destination} onChange={setDestination} action="repay" />
      <InternalRepayForm loan={loan} destination={destination} />
    </Stack>
  )
}
/**
 * Repay form for loans with `valuationMethod: outstandingDebt, discountedCashflow, cash`
 */
function InternalRepayForm({ loan, destination }: { loan: ActiveLoan; destination: string }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account?.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const loans = useLoans(loan.poolId)
  const api = useCentrifugeApi()
  const destinationLoan = loans?.find((l) => l.id === destination) as ActiveLoan

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
          const tx = api.tx.loans.decreaseDebt(pool.id, loan.id, { internal: principal })
          const categoryHex = Buffer.from(repayForm.values.category).toString('hex')
          repayTx = cent.wrapSignAndSend(api, api.tx.remarks.remark([{ Named: categoryHex }], tx), { batch: true })
        } else {
          const repay = { principal, interest, unscheduled: amountAdditional }
          const borrowAmount = new CurrencyBalance(
            principal.add(interest).add(amountAdditional),
            pool.currency.decimals
          )
          let borrow = { amount: borrowAmount }
          repayTx = cent.pools.transferLoanDebt([pool.id, loan.id, destinationLoan.id, repay, borrow], { batch: true })
        }
        return combineLatest([cent.getApi(), repayTx, poolFees.getBatch(repayForm)]).pipe(
          switchMap(([api, repayTx, batch]) => {
            if (batch.length) {
              const tx = wrapProxyCallsForAccount(api, api.tx.utility.batchAll([repayTx, ...batch]), account, 'Borrow')
              return cent.wrapSignAndSend(api, tx, options)
            }
            const tx = wrapProxyCallsForAccount(api, repayTx, account, 'Borrow')
            return cent.wrapSignAndSend(api, tx, options)
          })
        )
      },
    {
      onSuccess: () => {
        repayForm.resetForm()
      },
    }
  )

  const { execute: doCloseTransaction, isLoading: isCloseLoading } = useCentrifugeTransaction(
    'Close asset',
    (cent) => cent.pools.closeLoan
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
      const interest = CurrencyBalance.fromFloat(values.interest || 0, pool.currency.decimals)
      const additionalAmount = CurrencyBalance.fromFloat(values.amountAdditional || 0, pool.currency.decimals)
      const principal = CurrencyBalance.fromFloat(values.principal || 0, pool.currency.decimals)

      doRepayTransaction([principal, interest, additionalAmount], {
        account,
        forceProxyType: 'Borrow',
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  const { maxAvailable, maxPrincipal, maxInterest, totalRepay } = React.useMemo(() => {
    const { interest, principal, amountAdditional } = repayForm.values

    let maxAvailable
    let maxPrincipal
    let maxInterest
    if (destination === 'reserve') {
      maxAvailable = min(balance, loan.outstandingDebt.toDecimal())
      maxPrincipal = min(balance, loan.outstandingDebt.toDecimal())
      maxInterest = min(balance, loan.outstandingInterest.toDecimal())
    } else if (destination === 'other') {
      maxAvailable = min(balance, loan.outstandingDebt.toDecimal())
      maxPrincipal = min(balance, loan.outstandingDebt.toDecimal())
      maxInterest = Dec(0)
    } else {
      maxAvailable = destinationLoan.outstandingDebt?.toDecimal()
      maxPrincipal = destinationLoan.outstandingDebt.toDecimal()
      maxInterest = loan.outstandingInterest.toDecimal()
    }
    const totalRepay = Dec(principal || 0)
      .add(Dec(interest || 0))
      .add(Dec(amountAdditional || 0))
    return {
      maxAvailable,
      maxPrincipal: maxDec(min(maxPrincipal, maxAvailable.sub(interest || 0).sub(amountAdditional || 0)), Dec(0)),
      maxInterest: maxDec(min(maxInterest, maxAvailable.sub(principal || 0).sub(amountAdditional || 0)), Dec(0)),
      totalRepay,
    }
  }, [loan, destinationLoan, balance, repayForm.values])

  return (
    <>
      {maxAvailable.gt(0) ? (
        <FormikProvider value={repayForm}>
          <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
            <Field
              validate={combine(
                positiveNumberNotRequired(),
                maxNotRequired(maxAvailable.toNumber(), 'Principal exceeds available debt')
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
                    currency={pool?.currency.symbol}
                    onChange={(value) => form.setFieldValue('principal', value)}
                    onSetMax={() => form.setFieldValue('principal', maxPrincipal.gte(0) ? maxPrincipal : 0)}
                  />
                )
              }}
            </Field>
            {loan.outstandingInterest.toDecimal().gt(0) && !isCashLoan(loan) && (
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
                        pool?.currency.symbol,
                        2
                      )} interest accrued`}
                      disabled={isRepayLoading}
                      currency={pool?.currency.symbol}
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
                      currency={pool?.currency.symbol}
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
            <Stack gap={1}>
              <Shelf justifyContent="space-between">
                <Text variant="emphasized">Total amount</Text>
                <Text variant="emphasized">{formatBalance(totalRepay, pool?.currency.symbol, 2)}</Text>
              </Shelf>

              {poolFees.renderSummary()}

              <Shelf justifyContent="space-between">
                <Text variant="emphasized">Available</Text>
                <Text variant="emphasized">
                  {maxAvailable === UNLIMITED ? 'No limit' : formatBalance(maxAvailable, pool?.currency.symbol, 2)}
                </Text>
              </Shelf>
            </Stack>
            {balance.lessThan(maxAvailable) && destination === 'reserve' && (
              <Box bg="statusWarningBg" p={1}>
                <InlineFeedback status="warning">
                  <Text color="statusWarning">
                    Your wallet balance ({formatBalance(roundDown(balance), pool?.currency.symbol, 2)}) is smaller than
                    the outstanding balance ({formatBalance(maxAvailable, pool.currency.symbol)}).
                  </Text>
                </InlineFeedback>
              </Box>
            )}
            {totalRepay.gt(maxAvailable) && maxAvailable !== UNLIMITED && (
              <Box bg="statusCriticalBg" p={1}>
                <InlineFeedback status="critical">
                  <Text color="statusCritical">
                    Available debt ({formatBalance(maxAvailable, pool?.currency.symbol, 2)}) is smaller than the total
                    amount ({formatBalance(totalRepay, pool.currency.symbol)}).
                  </Text>
                </InlineFeedback>
              </Box>
            )}
            <Stack gap={1} px={1}>
              <Button
                type="submit"
                disabled={!poolFees.isValid(repayForm) || !repayForm.isValid}
                loading={isRepayLoading}
              >
                {isCashLoan(loan) ? 'Withdraw' : 'Repay'}
              </Button>
            </Stack>
          </Stack>
        </FormikProvider>
      ) : (
        <Button
          variant="secondary"
          loading={isCloseLoading}
          onClick={() => doCloseTransaction([loan.poolId, loan.id], { account, forceProxyType: 'Borrow' })}
        >
          Close
        </Button>
      )}
    </>
  )
}
