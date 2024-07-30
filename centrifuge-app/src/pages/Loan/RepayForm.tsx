import { ActiveLoan, CurrencyBalance, ExternalLoan, findBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { Dec, max as maxDec, min } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing, useLoans } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import {
  combine,
  max,
  maxNotRequired,
  nonNegativeNumberNotRequired,
  positiveNumber,
  positiveNumberNotRequired,
} from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { ExternalRepayForm } from './ExternalRepayForm'
import { SourceSelect } from './SourceSelect'
import { isExternalLoan } from './utils'

export type RepayValues = {
  principal: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  interest: number | '' | Decimal
  fees: { id: string; amount: number | '' | Decimal }[]
}

export function RepayForm({ loan }: { loan: ActiveLoan }) {
  const [destination, setDestination] = React.useState<string>('reserve')

  return (
    <Stack gap={2} p={1}>
      <Text variant="heading2">{isExternalLoan(loan) ? 'Sell' : 'Repay'}</Text>
      <SourceSelect loan={loan} value={destination} onChange={(newSource) => setDestination(newSource)} type="repay" />
      {isExternalLoan(loan) ? (
        <ExternalRepayForm loan={loan as ExternalLoan} destination={destination} />
      ) : (
        <InternalRepayForm loan={loan} destination={destination} />
      )}
    </Stack>
  )
}

function InternalRepayForm({ loan, destination }: { loan: ActiveLoan; destination: string }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account?.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  console.log('🚀 ~ balance:', balance.toString())
  const { debtWithMargin } = useAvailableFinancing(loan.poolId, loan.id)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const loans = useLoans(loan.poolId)
  const destinationLoan = loans?.find((l) => l.id === destination) as ActiveLoan

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) =>
      (
        args: [
          loanId: string,
          poolId: string,
          principal: CurrencyBalance,
          interest: CurrencyBalance,
          amountAdditional: CurrencyBalance
        ],
        options
      ) => {
        const [loanId, poolId, principal, interest, amountAdditional] = args
        let repayTx
        if (destination === 'reserve') {
          repayTx = cent.pools.repayLoanPartially([loanId, poolId, principal, interest, amountAdditional], {
            batch: true,
          })
        } else {
          const repay = { principal, interest }
          let borrow = { amount: principal }
          repayTx = cent.pools.transferLoanDebt([poolId, loan.id, destinationLoan.id, repay, borrow], { batch: true })
        }
        return combineLatest([cent.getApi(), repayTx, poolFees.getBatch(repayForm)]).pipe(
          switchMap(([api, repayTx, batch]) => {
            if (batch.length) {
              return cent.wrapSignAndSend(api, api.tx.utility.batchAll([repayTx, ...batch], options))
            }
            return cent.wrapSignAndSend(api, repayTx, options)
          })
        )
      },
    {
      onSuccess: () => {
        repayForm.resetForm()
      },
    }
  )

  const { execute: doRepayAllTransaction, isLoading: isRepayAllLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) => cent.pools.repayAndCloseLoan
  )

  const { execute: doCloseTransaction, isLoading: isCloseLoading } = useCentrifugeTransaction(
    'Close asset',
    (cent) => cent.pools.closeLoan
  )

  function repayAll() {
    doRepayAllTransaction([loan.poolId, loan.id, loan.totalBorrowed.sub(loan.repaid.principal)], {
      account,
      forceProxyType: 'Borrow',
    })
  }

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      principal: '',
      amountAdditional: '',
      interest: '',
      fees: [],
    },
    onSubmit: (values, actions) => {
      const interest = CurrencyBalance.fromFloat(values.interest || 0, pool.currency.decimals)
      const additionalAmount = CurrencyBalance.fromFloat(values.amountAdditional, pool.currency.decimals)
      const principal = CurrencyBalance.fromFloat(values.principal, pool.currency.decimals)

      doRepayTransaction([loan.poolId, loan.id, principal, interest, additionalAmount], {
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
    let maxAvailable = min(balance, loan.outstandingDebt.toDecimal())
    let maxPrincipal = min(balance, loan.outstandingDebt.toDecimal())
    let maxInterest = min(balance, loan.outstandingInterest.toDecimal())
    if (destination !== 'reserve') {
      maxAvailable = destinationLoan.outstandingDebt?.toDecimal()
      maxPrincipal = destinationLoan.outstandingDebt.toDecimal()
      maxInterest = destinationLoan.outstandingInterest.toDecimal()
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

  const canRepayAll = debtWithMargin?.lte(balance)

  return (
    <>
      {maxAvailable.gt(0) ? (
        <FormikProvider value={repayForm}>
          <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
            <Field
              validate={combine(positiveNumber(), max(maxAvailable.toNumber(), 'Principal exceeds available debt'))}
              name="principal"
            >
              {({ field, meta, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                    label="Principal"
                    disabled={isRepayLoading || isRepayAllLoading}
                    currency={pool?.currency.symbol}
                    onChange={(value) => form.setFieldValue('principal', value)}
                    onSetMax={() => form.setFieldValue('principal', maxPrincipal.gte(0) ? maxPrincipal : 0)}
                  />
                )
              }}
            </Field>
            {loan.outstandingInterest.toDecimal().gt(0) && (
              <Field
                validate={combine(
                  positiveNumberNotRequired(),
                  maxNotRequired(maxInterest.toNumber(), 'Interest exceeds available debt')
                )}
                name="interest"
              >
                {({ field, meta, form }: FieldProps) => {
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
                      disabled={isRepayLoading || isRepayAllLoading}
                      currency={pool?.currency.symbol}
                      onChange={(value) => form.setFieldValue('interest', value)}
                      onSetMax={() => form.setFieldValue('interest', maxInterest.gte(0) ? maxInterest : 0)}
                    />
                  )
                }}
              </Field>
            )}
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
                    disabled={isRepayLoading || isRepayAllLoading}
                    currency={pool?.currency.symbol}
                    onChange={(value) => form.setFieldValue('amountAdditional', value)}
                  />
                )
              }}
            </Field>
            {poolFees.render()}
            <Box bg="statusDefaultBg" p={1}>
              {destination === 'reserve' ? (
                <InlineFeedback status="default">
                  <Text color="statusDefault">Stable-coins will be transferred to the onchain reserve.</Text>
                </InlineFeedback>
              ) : (
                <InlineFeedback status="default">
                  <Text color="statusDefault">
                    Virtual accounting process. No onchain stable-coin transfers are expected.
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
                <Text variant="emphasized">{formatBalance(maxAvailable, pool?.currency.symbol, 2)}</Text>
              </Shelf>
            </Stack>
            {balance.lessThan(maxAvailable) && destination === 'reserve' && (
              <Box bg="statusCriticalBg" p={1}>
                <InlineFeedback status="critical">
                  <Text color="statusCritical">
                    Your wallet balance ({formatBalance(roundDown(balance), pool?.currency.symbol, 2)}) is smaller than
                    the outstanding balance ({formatBalance(maxAvailable, pool.currency.symbol)}).
                  </Text>
                </InlineFeedback>
              </Box>
            )}
            {totalRepay.gt(maxAvailable) && (
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
                disabled={
                  isRepayAllLoading || !poolFees.isValid(repayForm) || !repayForm.isValid || totalRepay.gt(maxAvailable)
                }
                loading={isRepayLoading}
              >
                Repay
              </Button>
              <Button
                variant="secondary"
                loading={isRepayAllLoading}
                disabled={!canRepayAll || isRepayLoading}
                onClick={() => repayAll()}
              >
                Repay all and close
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
