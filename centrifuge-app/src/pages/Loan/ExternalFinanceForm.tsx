import {
  ActiveLoan,
  CreatedLoan,
  CurrencyBalance,
  ExternalLoan,
  Pool,
  Price,
  WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeTransaction, wrapProxyCallsForAccount } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  CurrencyInput,
  IconCheckCircle,
  IconClock,
  InlineFeedback,
  Shelf,
  Stack,
  Text,
  Tooltip,
} from '@centrifuge/fabric'
import { BN } from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import styled, { useTheme } from 'styled-components'
import { AnchorTextLink } from '../../components/TextLink'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useLoans } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxPriceVariance, positiveNumber, required } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { ErrorMessage } from './ErrorMessage'
import { useWithdraw } from './FinanceForm'
import { SourceSelect } from './SourceSelect'

export type FinanceValues = {
  price: number | '' | Decimal
  quantity: number | ''
  withdraw: undefined | WithdrawAddress
  fees: { id: string; amount: '' | number | Decimal }[]
}

export const StyledSuccessButton = styled(Button)`
  span {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.statusOkBg};
    border-color: ${({ theme }) => theme.colors.statusOk};
    border-width: 1px;
    &:hover {
      background-color: ${({ theme }) => theme.colors.statusOkBg};
      border-color: ${({ theme }) => theme.colors.statusOk};
      border-width: 1px;
      box-shadow: none;
    }
  }
`

/**
 * Finance form for loans with `valuationMethod === oracle`
 */
export function ExternalFinanceForm({
  loan,
  source,
  setSource,
}: {
  loan: ExternalLoan
  source: string
  setSource: (source: string) => void
}) {
  const theme = useTheme()
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const api = useCentrifugeApi()
  const loans = useLoans(loan.poolId)
  const sourceLoan = loans?.find((l) => l.id === source) as CreatedLoan | ActiveLoan
  const displayCurrency = source === 'reserve' ? pool.currency.symbol : 'USD'
  const [transactionSuccess, setTransactionSuccess] = React.useState(false)
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Purchase asset',
    (cent) => (args: [poolId: string, loanId: string, quantity: Price, price: CurrencyBalance], options) => {
      if (!account) throw new Error('No borrower')
      const [poolId, loanId, quantity, price] = args
      let financeTx
      if (source === 'reserve') {
        financeTx = cent.pools.financeExternalLoan([poolId, loanId, quantity, price], { batch: true })
      } else {
        const principal = CurrencyBalance.fromFloat(
          price.toDecimal().mul(quantity.toDecimal()).toString(),
          pool.currency.decimals
        )
        const repay = { principal, interest: new BN(0), unscheduled: new BN(0) }
        const borrow = {
          quantity,
          price,
          interest: new BN(0),
          unscheduled: new BN(0),
        }
        financeTx = cent.pools.transferLoanDebt([poolId, sourceLoan.id, loan.id, repay, borrow], { batch: true })
      }
      return combineLatest([financeTx, withdraw.getBatch(financeForm), poolFees.getBatch(financeForm)]).pipe(
        switchMap(([loanTx, withdrawBatch, poolFeesBatch]) => {
          let batch = [...withdrawBatch, ...poolFeesBatch]
          let tx = wrapProxyCallsForAccount(api, loanTx, account, 'Borrow')
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

  const financeForm = useFormik<FinanceValues>({
    initialValues: {
      price: '',
      quantity: '',
      withdraw: undefined,
      fees: [],
    },
    onSubmit: (values, actions) => {
      const price = CurrencyBalance.fromFloat(values.price.toString(), pool.currency.decimals)
      const quantity = Price.fromFloat(values.quantity.toString())
      doFinanceTransaction([loan.poolId, loan.id, quantity, price], {
        account,
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  React.useEffect(() => {
    financeForm.validateForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  const totalFinance = Dec(financeForm.values.price || 0).mul(Dec(financeForm.values.quantity || 0))
  const maxAvailable =
    source === 'reserve' ? pool.reserve.available.toDecimal() : sourceLoan.outstandingDebt.toDecimal()

  const withdraw = useWithdraw(loan.poolId, account!, totalFinance, source)

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  return (
    <>
      {
        <FormikProvider value={financeForm}>
          <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
            <Box
              px={3}
              py={2}
              backgroundColor={theme.colors.backgroundSecondary}
              borderRadius={10}
              border={`1px solid ${theme.colors.borderPrimary}`}
            >
              <Stack gap={2}>
                <SourceSelect loan={loan} value={source} onChange={setSource} action="finance" />
                <Shelf gap={2}>
                  <Field name="quantity" validate={combine(required(), positiveNumber())}>
                    {({ field, form }: FieldProps) => {
                      return (
                        <CurrencyInput
                          {...field}
                          label="Quantity"
                          placeholder="0"
                          onChange={(value) => form.setFieldValue('quantity', value)}
                        />
                      )
                    }}
                  </Field>
                  <Field
                    name="price"
                    validate={combine(
                      required(),
                      positiveNumber(),
                      (val) => {
                        const financeAmount = Dec(val).mul(financeForm.values.quantity || 1)
                        return financeAmount.gt(maxAvailable)
                          ? `Amount exceeds available (${formatBalance(maxAvailable, displayCurrency, 2)})`
                          : ''
                      },
                      maxPriceVariance(loan.pricing)
                    )}
                  >
                    {({ field, form }: FieldProps) => {
                      return (
                        <CurrencyInput
                          {...field}
                          label="Price"
                          currency={displayCurrency}
                          onChange={(value) => form.setFieldValue('price', value)}
                          decimals={8}
                        />
                      )
                    }}
                  </Field>
                </Shelf>
                <Shelf justifyContent="flex-end">
                  <Text variant="body2" color="textPrimary">
                    ={' '}
                    {formatBalance(
                      Dec(financeForm.values.price || 0).mul(financeForm.values.quantity || 0),
                      displayCurrency,
                      2
                    )}{' '}
                    principal
                  </Text>
                </Shelf>
                {source === 'reserve' && withdraw.render()}
                {poolFees.render()}
              </Stack>
            </Box>

            <ErrorMessage type="critical" condition={totalFinance.gt(0) && totalFinance.gt(maxAvailable)}>
              Principal amount ({formatBalance(totalFinance, displayCurrency, 2)}) is greater than the available balance
              ({formatBalance(maxAvailable, displayCurrency, 2)}).
            </ErrorMessage>

            <ErrorMessage
              type="default"
              condition={
                source === 'reserve' && totalFinance.gt(maxAvailable) && pool.reserve.total.gt(pool.reserve.available)
              }
            >
              There is an additional{' '}
              {formatBalance(
                new CurrencyBalance(pool.reserve.total.sub(pool.reserve.available), pool.currency.decimals),
                displayCurrency
              )}{' '}
              available from repayments or deposits. This requires first executing the orders on the{' '}
              <AnchorTextLink href={`#/pools/${pool.id}/liquidity`}>Liquidity tab</AnchorTextLink>.
            </ErrorMessage>

            <Stack gap={2} mt={2} border={`1px solid ${theme.colors.borderPrimary}`} px={3} py={2} borderRadius={10}>
              <Text variant="heading4">Transaction summary</Text>
              <Box padding={2}>
                <Stack gap={1} mb={3}>
                  <Shelf justifyContent="space-between">
                    <Tooltip body={'Balance of the source asset'} style={{ pointerEvents: 'auto' }}>
                      <Text variant="body2" color="textSecondary">
                        Available balance
                      </Text>
                    </Tooltip>

                    <Text variant="body2">{formatBalance(maxAvailable, displayCurrency, 2)}</Text>
                  </Shelf>

                  <Stack gap={1}>
                    <Shelf justifyContent="space-between">
                      <Text variant="body2" color="textSecondary">
                        Principal amount
                      </Text>
                      <Text variant="body2">{formatBalance(totalFinance, displayCurrency, 2)}</Text>
                    </Shelf>
                  </Stack>
                  {poolFees.renderSummary()}
                </Stack>

                {source === 'reserve' ? (
                  <InlineFeedback status="default">
                    <Text variant="body2" color="statusDefault">
                      Stablecoins will be transferred to the designated withdrawal addresses on the specified networks.
                      A delay may occur before the transfer is completed.
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

            <Stack>
              {transactionSuccess ? (
                <StyledSuccessButton icon={<IconCheckCircle size={24} />}>Transaction successful</StyledSuccessButton>
              ) : (
                <Button
                  type="submit"
                  disabled={
                    !withdraw.isValid(financeForm) ||
                    !poolFees.isValid(financeForm) ||
                    !financeForm.isValid ||
                    maxAvailable.eq(0)
                  }
                  icon={isFinanceLoading ? <IconClock size={24} /> : undefined}
                >
                  {isFinanceLoading ? 'Transaction Pending' : 'Purchase'}
                </Button>
              )}
            </Stack>
          </Stack>
        </FormikProvider>
      }
    </>
  )
}
