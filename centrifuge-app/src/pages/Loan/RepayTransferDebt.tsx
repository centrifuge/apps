import { ExternalPricingInfo } from '@centrifuge/centrifuge-js'
import { Box, CurrencyInput, NumberInput, Shelf } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import { useLoans } from '../../utils/useLoans'
import { usePool } from '../../utils/usePools'
import { combine, maxPriceVariance, positiveNumber } from '../../utils/validation'

type Props = {
  poolId: string
  source: string
}

export function RepayTransferDebtFields({ poolId, source }: Props) {
  const loans = useLoans(poolId)
  const pool = usePool(poolId)
  return (
    <>
      <Shelf gap={2}>
        <Box flex={1}>
          <Field validate={combine(positiveNumber())} name="quantity">
            {({ field, meta }: FieldProps) => {
              return (
                <NumberInput
                  {...field}
                  label="Quantity"
                  placeholder="0"
                  errorMessage={meta.touched ? meta.error : undefined}
                />
              )
            }}
          </Field>
        </Box>
        <Box flex={2}>
          <Field
            name="price"
            validate={combine(maxPriceVariance(loans!.find((l) => l.id === source)!.pricing as ExternalPricingInfo))}
          >
            {({ field, meta, form }: FieldProps) => {
              return (
                <CurrencyInput
                  {...field}
                  label="Settlement price"
                  errorMessage={meta.touched ? meta.error : undefined}
                  currency={pool.currency.symbol}
                  onChange={(value) => form.setFieldValue('price', value)}
                  decimals={8}
                />
              )
            }}
          </Field>
        </Box>
      </Shelf>
      <Shelf gap={2}>
        <Box flex={1}>
          <Field validate={combine(positiveNumber())} name="interest">
            {({ field, meta }: FieldProps) => {
              return (
                <NumberInput
                  {...field}
                  label="Quantity"
                  placeholder="0"
                  errorMessage={meta.touched ? meta.error : undefined}
                />
              )
            }}
          </Field>
        </Box>
        <Box flex={2}>
          <Field
            name=""
            validate={combine(maxPriceVariance(loans!.find((l) => l.id === source)!.pricing as ExternalPricingInfo))}
          >
            {({ field, meta, form }: FieldProps) => {
              return (
                <CurrencyInput
                  {...field}
                  label="Settlement price"
                  errorMessage={meta.touched ? meta.error : undefined}
                  currency={pool.currency.symbol}
                  onChange={(value) => form.setFieldValue('amountAdditional', value)}
                  decimals={8}
                />
              )
            }}
          </Field>
        </Box>
      </Shelf>
    </>
  )
}
