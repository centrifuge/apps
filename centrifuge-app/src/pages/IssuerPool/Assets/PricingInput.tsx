import {
  Checkbox,
  CurrencyInput,
  DateInput,
  Grid,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { Tooltips } from '../../../components/Tooltips'
import { usePool } from '../../../utils/usePools'
import { combine, max, nonNegativeNumber, positiveNumber, required } from '../../../utils/validation'
import { validate } from '../../IssuerCreatePool/validate'
import { CreateLoanFormValues } from './CreateLoan'

export function PricingInput({ poolId }: { poolId: string }) {
  const { values } = useFormikContext<CreateLoanFormValues>()
  const pool = usePool(poolId)
  return (
    <Grid columns={[1, 2, 2, 3]} gap={2} rowGap={3}>
      {values.pricing.valuationMethod === 'oracle' && (
        <>
          <Field name="pricing.oracleSource">
            {({ field, meta, form }: FieldProps) => (
              <Select
                {...field}
                label="Oracle source"
                onChange={(event) => form.setFieldValue('pricing.oracleSource', event.target.value, false)}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                options={[
                  { value: 'isin', label: 'ISIN' },
                  { value: 'assetSpecific', label: 'Asset specific' },
                ]}
                placeholder="..."
              />
            )}
          </Field>
          {values.pricing.oracleSource === 'isin' && (
            <FieldWithErrorMessage
              as={TextInput}
              label={<Tooltips type="isin" variant="secondary" label="ISIN*" />}
              placeholder="010101010000"
              name="pricing.isin"
              validate={validate.isin}
            />
          )}
          <Field
            name="pricing.notional"
            validate={combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER))}
          >
            {({ field, meta, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                label={<Tooltips type="notionalValue" variant="secondary" label="Notional value*" />}
                placeholder="0.00"
                errorMessage={meta.touched ? meta.error : undefined}
                onChange={(value) => {
                  form.setFieldValue('pricing.notional', value)
                  if (value === 0) {
                    form.setFieldValue('pricing.interestRate', 0)
                  }
                }}
                currency={pool.currency.symbol}
              />
            )}
          </Field>
          <Stack py={2} justifyContent="flex-end">
            <Field name="pricing.withLinearPricing">
              {({ field, meta }: FieldProps) => (
                <Checkbox
                  errorMessage={meta.touched ? meta.error : undefined}
                  label={<Text variant="body2">With linear pricing?</Text>}
                  {...field}
                />
              )}
            </Field>
          </Stack>
        </>
      )}

      {(values.pricing.valuationMethod === 'discountedCashFlow' ||
        values.pricing.valuationMethod === 'outstandingDebt') && (
        <>
          <Field name="pricing.maxBorrowAmount">
            {({ field, meta, form }: FieldProps) => (
              <Select
                {...field}
                label="How much can I borrow?"
                onChange={(event) => form.setFieldValue('pricing.maxBorrowAmount', event.target.value, false)}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                options={[
                  { value: 'upToTotalBorrowed', label: 'Up to total borrowed' },
                  { value: 'upToOutstandingDebt', label: 'Up to outstanding debt' },
                ]}
                placeholder="Choose borrow restriction"
              />
            )}
          </Field>

          <Field name="pricing.value" validate={combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER))}>
            {({ field, meta, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                label="Collateral value*"
                placeholder="0.00"
                errorMessage={meta.touched ? meta.error : undefined}
                currency={pool?.currency.symbol}
                onChange={(value) => form.setFieldValue('pricing.value', value)}
              />
            )}
          </Field>
        </>
      )}
      {values.pricing.valuationMethod !== 'cash' && (
        <FieldWithErrorMessage
          as={NumberInput}
          label={<Tooltips type="interestRate" variant="secondary" label="Interest rate*" />}
          placeholder="0.00"
          symbol="%"
          disabled={Number(values.pricing.notional) <= 0}
          name="pricing.interestRate"
          validate={combine(required(), nonNegativeNumber(), max(100))}
        />
      )}
      <FieldWithErrorMessage
        as={DateInput}
        validate={validate.maturityDate}
        name="pricing.maturityDate"
        label="Maturity date*"
        type="date"
        // Min one day from now
        min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
        // Max 5 years from now
        max={new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
      />
      <FieldWithErrorMessage
        as={NumberInput}
        label={<Tooltips type="maturityExtensionDays" variant="secondary" label="Extension period*" />}
        placeholder={0}
        symbol="days"
        name="pricing.maturityExtensionDays"
        validate={validate.maturityExtensionDays}
      />

      {(values.pricing.valuationMethod === 'discountedCashFlow' ||
        values.pricing.valuationMethod === 'outstandingDebt') && (
        <>
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="advanceRate" variant="secondary" label="Advance rate*" />}
            placeholder="0.00"
            symbol="%"
            name="pricing.advanceRate"
            validate={validate.advanceRate}
          />
        </>
      )}
      {values.pricing.valuationMethod === 'discountedCashFlow' && (
        <>
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="probabilityOfDefault" variant="secondary" label="Probability of default*" />}
            placeholder="0.00"
            symbol="%"
            name="pricing.probabilityOfDefault"
            validate={validate.probabilityOfDefault}
          />
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="lossGivenDefault" variant="secondary" label="Loss given default*" />}
            placeholder="0.00"
            symbol="%"
            name="pricing.lossGivenDefault"
            validate={validate.lossGivenDefault}
          />
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="discountRate" variant="secondary" label="Discount rate*" />}
            placeholder="0.00"
            symbol="%"
            name="pricing.discountRate"
            validate={validate.discountRate}
          />
        </>
      )}
    </Grid>
  )
}
