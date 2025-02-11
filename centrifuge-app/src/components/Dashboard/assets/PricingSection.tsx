import { CurrencyInput, DateInput, Grid, NumberInput, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../../src/components/Tooltips'
import { validate } from '../../../../src/pages/IssuerCreatePool/validate'
import { combine, max, nonNegativeNumber, positiveNumber, required } from '../../../../src/utils/validation'
import { CreateAssetFormValues } from './CreateAssetsDrawer'

export function PricingSection() {
  const theme = useTheme()
  const form = useFormikContext<CreateAssetFormValues>()
  const { values } = form
  const isOracle = values.assetType === 'liquid' || values.assetType === 'fund'
  return (
    <Grid
      p={2}
      backgroundColor="backgroundSecondary"
      borderRadius={8}
      border={`1px solid ${theme.colors.borderPrimary}`}
      mb={2}
      gap={2}
    >
      {values.assetType === 'custom' && (
        <>
          <Field name="maxBorrowAmount">
            {({ field, meta, form }: FieldProps) => (
              <Select
                {...field}
                label="How much can I borrow?"
                onChange={(event) => form.setFieldValue('maxBorrowAmount', event.target.value, false)}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                options={[
                  { value: 'upToTotalBorrowed', label: 'Up to total borrowed' },
                  { value: 'upToOutstandingDebt', label: 'Up to outstanding debt' },
                ]}
                placeholder="Choose borrow restriction"
              />
            )}
          </Field>
          <Field name="value" validate={combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER))}>
            {({ field, meta, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                label="Collateral value*"
                placeholder="0.00"
                errorMessage={meta.touched ? meta.error : undefined}
                currency={values.selectedPool.currency.symbol}
                onChange={(value) => form.setFieldValue('value', value)}
              />
            )}
          </Field>
        </>
      )}
      {isOracle && (
        <>
          <Field name="oracleSource">
            {({ field, meta, form }: FieldProps) => (
              <Select
                {...field}
                label="Oracle source"
                onChange={(event) => form.setFieldValue('oracleSource', event.target.value, false)}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                options={[
                  { value: 'isin', label: 'ISIN' },
                  { value: 'assetSpecific', label: 'Asset specific' },
                ]}
              />
            )}
          </Field>
          <FieldWithErrorMessage
            as={TextInput}
            label={<Tooltips type="isin" label={<Text variant="heading4">ISIN*</Text>} />}
            placeholder="Type here..."
            name="isin"
            validate={validate.isin}
          />
          <Field name="notional" validate={combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER))}>
            {({ field, meta, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                label={<Tooltips type="notionalValue" label={<Text variant="heading4">Notional value*</Text>} />}
                placeholder="0.00"
                errorMessage={meta.touched ? meta.error : undefined}
                onChange={(value) => {
                  form.setFieldValue('notional', value)
                  if (value === 0) {
                    form.setFieldValue('interestRate', 0)
                  }
                }}
                currency={values.selectedPool.currency.symbol}
              />
            )}
          </Field>
          <Field name="withLinearPricing">
            {({ field, meta }: FieldProps) => (
              <Select
                {...field}
                label="With linear pricing?"
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                onChange={(event) => form.setFieldValue('withLinearPricing', event.target.value, false)}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
              />
            )}
          </Field>
        </>
      )}
      <FieldWithErrorMessage
        as={NumberInput}
        label={<Tooltips type="interestRate" label={<Text variant="heading4">Interest rate*</Text>} />}
        placeholder="0.00"
        symbol="%"
        disabled={Number(values.notional) <= 0}
        name="interestRate"
        validate={combine(required(), nonNegativeNumber(), max(100))}
      />
      <Field name="maturity">
        {({ field, meta, form }: FieldProps) => (
          <Select
            {...field}
            label="Maturity"
            onChange={(event) => form.setFieldValue('maturity', event.target.value, false)}
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
            options={[
              { value: 'fixed', label: 'Fixed' },
              { value: 'fixedWithExtension', label: 'Fixed with extension period' },
              values.customType !== 'discountedCashFlow' ? { value: 'none', label: 'Open-end' } : (null as never),
            ].filter(Boolean)}
          />
        )}
      </Field>
      {values.maturity.startsWith('fixed') && (
        <FieldWithErrorMessage
          as={DateInput}
          validate={validate.maturityDate}
          name="maturityDate"
          label="Maturity date*"
          type="date"
          // Min one day from now
          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
          // Max 5 years from now
          max={new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
        />
      )}
      {values.assetType === 'custom' && (
        <FieldWithErrorMessage
          as={NumberInput}
          label={<Tooltips type="advanceRate" label={<Text variant="heading4">Advance rate*</Text>} />}
          placeholder="0.00"
          symbol="%"
          name="pricing.advanceRate"
          validate={validate.advanceRate}
        />
      )}
      {values.assetType === 'custom' && values.customType === 'discountedCashFlow' && (
        <>
          <FieldWithErrorMessage
            as={NumberInput}
            label={
              <Tooltips type="probabilityOfDefault" label={<Text variant="heading4">Probability of default*</Text>} />
            }
            placeholder="0.00"
            symbol="%"
            name="probabilityOfDefault"
            validate={validate.probabilityOfDefault}
          />
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="lossGivenDefault" label={<Text variant="heading4">Loss given default*</Text>} />}
            placeholder="0.00"
            symbol="%"
            name="lossGivenDefault"
            validate={validate.lossGivenDefault}
          />
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="discountRate" label={<Text variant="heading4">Discount rate*</Text>} />}
            placeholder="0.00"
            symbol="%"
            name="discountRate"
            validate={validate.discountRate}
          />
        </>
      )}
    </Grid>
  )
}
