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
import { SellForm } from './SellForm'
import { SourceSelect } from './SourceSelect'
import { WithdrawForm } from './WithdrawForm'
import { isCashLoan, isExternalLoan } from './utils'

export type RepayValues = {
  principal: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  interest: number | '' | Decimal
  fees: { id: string; amount: number | '' | Decimal }[]
}

export function RepayForm({ loan }: { loan: ActiveLoan }) {
  const [destination, setDestination] = React.useState<string>('reserve')

  if (isCashLoan(loan)) {
    return (
      <Stack gap={2} p={1}>
        <Text variant="heading2">Withdraw</Text>
        <SourceSelect loan={loan} value={destination} onChange={setDestination} type="repay" />
        <WithdrawForm loan={loan as ExternalLoan} destination={destination} />
      </Stack>
    )
  }

  if (isExternalLoan(loan)) {
    return (
      <Stack gap={2} p={1}>
        <Text variant="heading2">Sell</Text>
        <SourceSelect loan={loan} value={destination} onChange={setDestination} type="repay" />
        <SellForm loan={loan as ExternalLoan} destination={destination} />
      </Stack>
    )
  }

  return (
    <Stack gap={2} p={1}>
      <Text variant="heading2">{isExternalLoan(loan) ? 'Sell' : 'Repay'}</Text>
      <SourceSelect loan={loan} value={destination} onChange={setDestination} type="repay" />
      <InternalRepayForm loan={loan} destination={destination} />
    </Stack>
  )
}

function InternalRepayForm({ loan, destination }: { loan: ActiveLoan; destination: string }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account?.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
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
    },
    onSubmit: (values, actions) => {
      const interest = CurrencyBalance.fromFloat(values.interest || 0, pool.currency.decimals)
      const additionalAmount = CurrencyBalance.fromFloat(values.amountAdditional || 0, pool.currency.decimals)
      const principal = CurrencyBalance.fromFloat(values.principal || 0, pool.currency.decimals)

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
                    label="Principal"
                    disabled={isRepayLoading}
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
                <Text variant="emphasized">{formatBalance(maxAvailable, pool?.currency.symbol, 2)}</Text>
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
                disabled={!poolFees.isValid(repayForm) || !repayForm.isValid || totalRepay.gt(maxAvailable)}
                loading={isRepayLoading}
              >
                Repay
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
