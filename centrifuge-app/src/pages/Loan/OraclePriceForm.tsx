import { CurrencyBalance, Loan as LoanType, Price } from '@centrifuge/centrifuge-js'
import { useAddress, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Card, CurrencyInput, Flex, IconArrowDown, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { switchMap } from 'rxjs'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useCanSetOraclePrice } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, positiveNumber } from '../../utils/validation'

type PriceValues = {
  currentPrice: number | Decimal
  newPrice: number | ''
}

export function OraclePriceForm({
  loan,
  setShowOraclePricing,
}: {
  loan: LoanType
  setShowOraclePricing: (showOraclePricing: boolean) => void
}) {
  const address = useAddress()
  const canPrice = useCanSetOraclePrice(address)
  const pool = usePool(loan.poolId)

  const { execute: doOraclePriceTransaction, isLoading: isOraclePriceLoading } = useCentrifugeTransaction(
    'Set oracle price',
    (cent) => (args: [price: Price], options) => {
      const [price] = args
      return cent.getApi().pipe(
        switchMap((api) => {
          if ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle') {
            const submittable = api.tx.priceOracle.feedValues([[{ Isin: loan.pricing.Isin }, price]])
            return cent.wrapSignAndSend(api, submittable, options)
          } else {
            throw new Error('Wrong loan type')
          }
        })
      )
    },
    {
      onSuccess: () => {
        oraclePriceForm.resetForm()
        setShowOraclePricing(false)
      },
    }
  )

  const oraclePriceForm = useFormik<PriceValues>({
    initialValues: {
      currentPrice:
        'oracle' in loan.pricing ? new CurrencyBalance(loan.pricing.oracle.value.toString(), 18).toDecimal() : 0,
      newPrice: '',
    },
    onSubmit: (values, actions) => {
      const newPrice = Price.fromFloat(values.newPrice)
      doOraclePriceTransaction([newPrice])
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const priceFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(oraclePriceForm, priceFormRef)

  if (
    !canPrice ||
    loan.status === 'Closed' ||
    !('valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle') ||
    import.meta.env.REACT_APP_COLLATOR_WSS_URL === 'wss://fullnode.parachain.centrifuge.io'
  ) {
    return null
  }

  return (
    <Stack gap={3}>
      <Stack as={Card} gap={2} p={2}>
        <Box paddingY={1}>
          <Text variant="heading4">Update price</Text>
        </Box>
        <FormikProvider value={oraclePriceForm}>
          <Stack as={Form} gap={2} noValidate ref={priceFormRef}>
            <Field name="currentPrice">
              {({ field }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    variant="small"
                    label="Current price"
                    disabled
                    precision={6}
                    currency={pool.currency.symbol}
                  />
                )
              }}
            </Field>
            <Flex justifyContent="center">
              <IconArrowDown />
            </Flex>
            <Field validate={combine(positiveNumber())} name="newPrice">
              {({ field, meta, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    variant="small"
                    label="New price"
                    errorMessage={meta.touched ? meta.error : undefined}
                    disabled={isOraclePriceLoading}
                    currency={pool.currency.symbol}
                    onChange={(value) => form.setFieldValue('newPrice', value)}
                    precision={6}
                  />
                )
              }}
            </Field>
            <Text variant="body3">Current exchange rate: 1 USD = 1 {pool.currency.symbol}</Text>
            <Button type="submit" disabled={isOraclePriceLoading} loading={isOraclePriceLoading}>
              Update price
            </Button>
          </Stack>
        </FormikProvider>
      </Stack>
    </Stack>
  )
}
