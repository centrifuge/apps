import { ActiveLoan, CurrencyBalance, Pool, Price } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeTransaction, wrapProxyCallsForAccount } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, max, maxPriceVariance, positiveNumber, required } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { isCashLoan, isExternalLoan, isInternalLoan } from './utils'

export type CorrectionValues = {
  principal: number | '' | Decimal
  price: number | '' | Decimal
  quantity: number | '' | Decimal
  fees: { id: string; amount: '' | number | Decimal }[]
  reason: string
}

export function CorrectionForm({ loan }: { loan: ActiveLoan }) {
  const theme = useTheme()
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const { initial: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const api = useCentrifugeApi()
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Adjust asset',
    (cent) => (args: [poolId: string, loanId: string, values: CorrectionValues], options) => {
      if (!account) throw new Error('No borrower')
      const [poolId, loanId, values] = args

      let principal
      let isIncrease
      if (isExternalLoan(loan)) {
        const oldQuantity = loan.pricing.outstandingQuantity
        const price = CurrencyBalance.fromFloat(values.price, pool.currency.decimals)
        const quantity = Price.fromFloat(values.quantity)
        isIncrease = oldQuantity.lt(quantity)
        const diff = quantity.sub(oldQuantity)
        principal = {
          external: {
            price: price.toString(),
            quantity: (isIncrease ? diff : diff.neg()).toString(),
          },
        }
      } else {
        const amount = CurrencyBalance.fromFloat(values.principal, pool.currency.decimals)
        isIncrease = loan.outstandingPrincipal.lt(amount)
        const diff = amount.sub(loan.outstandingPrincipal)
        principal = { internal: (isIncrease ? diff : diff.neg()).toString() }
      }
      let correctTx
      if (isIncrease) {
        correctTx = api.tx.loans.increaseDebt(poolId, loanId, principal)
      } else {
        correctTx = api.tx.loans.decreaseDebt(poolId, loanId, {
          principal,
          interest: 0,
          unscheduled: 0,
        })
      }
      const tx = cent.remark.remark([[{ Named: values.reason }], correctTx], { batch: true })
      return combineLatest([tx, poolFees.getBatch(correctionForm)]).pipe(
        switchMap(([correctTx, poolFeesBatch]) => {
          let batch = [...poolFeesBatch]
          let tx = wrapProxyCallsForAccount(api, correctTx, account, 'Borrow')
          if (batch.length) {
            tx = api.tx.utility.batchAll([tx, ...batch])
          }
          return cent.wrapSignAndSend(api, tx, { ...options, proxies: undefined })
        })
      )
    },
    {
      onSuccess: () => {
        correctionForm.setFieldValue('fees', [], false)
        correctionForm.setFieldValue('reason', '', false)
      },
    }
  )

  const correctionForm = useFormik<CorrectionValues>({
    initialValues: {
      principal: loan.outstandingPrincipal.toDecimal(),
      price: isExternalLoan(loan) ? loan.currentPrice.toDecimal() : '',
      quantity: isExternalLoan(loan) ? loan.pricing.outstandingQuantity.toDecimal() : '',
      fees: [],
      reason: '',
    },
    onSubmit: (values, actions) => {
      doFinanceTransaction([loan.poolId, loan.id, values], {
        account,
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const correctionFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(correctionForm, correctionFormRef)

  const oldPrincipal = loan.outstandingPrincipal.toDecimal()
  const newPrincipal = isExternalLoan(loan)
    ? Dec(correctionForm.values.price || 0).mul(Dec(correctionForm.values.quantity || 0))
    : Dec(correctionForm.values.principal || 0)
  const isIncrease = oldPrincipal.lt(newPrincipal)

  return (
    <FormikProvider value={correctionForm}>
      <Stack as={Form} gap={2} p={1} noValidate ref={correctionFormRef}>
        <Text variant="heading2">Correction</Text>
        <Box
          px={3}
          py={2}
          backgroundColor={theme.colors.backgroundSecondary}
          borderRadius={10}
          border={`1px solid ${theme.colors.borderPrimary}`}
        >
          <Stack gap={1}>
            {isExternalLoan(loan) ? (
              <>
                <Shelf gap={1}>
                  <Field
                    name="quantity"
                    validate={combine(
                      required(),
                      positiveNumber(),
                      max(availableFinancing.toNumber(), 'The amount exceeds the available financing')
                    )}
                  >
                    {({ field, form, meta }: FieldProps) => {
                      return (
                        <CurrencyInput
                          {...field}
                          label="Quantity"
                          placeholder="0"
                          onChange={(value) => form.setFieldValue('quantity', value)}
                          errorMessage={meta.touched ? meta.error : undefined}
                        />
                      )
                    }}
                  </Field>
                  <Field name="price" validate={combine(required(), positiveNumber(), maxPriceVariance(loan.pricing))}>
                    {({ field, form, meta }: FieldProps) => {
                      return (
                        <CurrencyInput
                          {...field}
                          label="Price"
                          currency={pool.currency.symbol}
                          onChange={(value) => form.setFieldValue('price', value)}
                          decimals={8}
                          errorMessage={meta.touched ? meta.error : undefined}
                        />
                      )
                    }}
                  </Field>
                </Shelf>
                <Shelf justifyContent="flex-end">
                  <Text variant="body2" color="textPrimary">
                    ={' '}
                    {formatBalance(
                      Dec(correctionForm.values.price || 0).mul(correctionForm.values.quantity || 0),
                      pool.currency.symbol,
                      2
                    )}{' '}
                    principal
                  </Text>
                </Shelf>
              </>
            ) : isInternalLoan(loan) ? (
              <FieldWithErrorMessage
                name="principal"
                validate={combine(
                  positiveNumber(),
                  max(availableFinancing.toNumber(), 'The amount exceeds the available financing')
                )}
              >
                {({ field, form, meta }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                      label={isCashLoan(loan) ? 'Amount' : 'Principal'}
                      currency={pool.currency.symbol}
                      onChange={(value) => form.setFieldValue('principal', value)}
                      errorMessage={meta.touched ? meta.error : undefined}
                    />
                  )
                }}
              </FieldWithErrorMessage>
            ) : null}
            <FieldWithErrorMessage
              validate={required()}
              name="reason"
              as={TextInput}
              label="Reason"
              placeholder=""
              maxLength={40}
            />
            {poolFees.render()}
          </Stack>
        </Box>

        <Stack gap={2} mt={2} border={`1px solid ${theme.colors.borderPrimary}`} px={3} py={2} borderRadius={10}>
          <Text variant="heading4">Summary</Text>
          <Stack gap={1} mb={1}>
            <Shelf justifyContent="space-between">
              <Text variant="body2" color="textSecondary">
                Old holdings
              </Text>
              <Text variant="body2">{formatBalance(oldPrincipal, pool.currency.symbol, 2)}</Text>
            </Shelf>
            <Shelf justifyContent="space-between">
              <Text variant="body2" color="textSecondary">
                New holdings
              </Text>
              <Text variant="body2">
                {formatBalance(newPrincipal, pool.currency.symbol, 2)} (
                <Text color={isIncrease ? 'statusOk' : 'statusCritical'}>
                  {isIncrease ? '+' : ''}
                  {formatBalance(newPrincipal.minus(oldPrincipal), pool.currency.symbol, 2)}
                </Text>
                )
              </Text>
            </Shelf>
          </Stack>
          {poolFees.renderSummary()}
        </Stack>

        <Stack>
          <Button
            type="submit"
            loading={isFinanceLoading}
            disabled={!poolFees.isValid(correctionForm) || !correctionForm.isValid}
          >
            Adjust
          </Button>
        </Stack>
      </Stack>
    </FormikProvider>
  )
}
