import { Loan as LoanType, Rate } from '@centrifuge/centrifuge-js'
import { useAddress, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, Stack } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { switchMap } from 'rxjs'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useCanSetOraclePrice } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, positiveNumber } from '../../utils/validation'

type PriceValues = {
  price: number | '' | Decimal
}

export function OraclePriceForm({ loan }: { loan: LoanType }) {
  const address = useAddress()
  const canPrice = useCanSetOraclePrice(address)
  const pool = usePool(loan.poolId)

  const { execute: doOraclePriceTransaction, isLoading: isOraclePriceLoading } = useCentrifugeTransaction(
    'Set oracle price',
    (cent) => (args: [price: Rate], options) => {
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
      },
    }
  )

  const oraclePriceForm = useFormik<PriceValues>({
    initialValues: {
      price: '',
    },
    onSubmit: (values, actions) => {
      const price = Rate.fromFloat(values.price)
      doOraclePriceTransaction([price])
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
        <FormikProvider value={oraclePriceForm}>
          <Stack as={Form} gap={2} noValidate ref={priceFormRef}>
            <Field validate={combine(positiveNumber())} name="price">
              {({ field, meta, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    variant="small"
                    label="Price"
                    errorMessage={meta.touched ? meta.error : undefined}
                    disabled={isOraclePriceLoading}
                    currency={pool.currency.symbol}
                    onChange={(value) => form.setFieldValue('price', value)}
                    precision={6}
                  />
                )
              }}
            </Field>
            <Button type="submit" disabled={isOraclePriceLoading} loading={isOraclePriceLoading}>
              Update price
            </Button>
          </Stack>
        </FormikProvider>
      </Stack>
    </Stack>
  )
}
