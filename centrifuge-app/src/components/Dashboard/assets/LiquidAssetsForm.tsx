import { CurrencyInput, DateInput, Grid, NumberInput, Select, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useTheme } from 'styled-components'
import { Tooltips } from '../../../../src/components/Tooltips'
import { useAssetsContext } from './AssetsContext'
import { CreateAssetFormValues } from './CreateAssetsDrawer'

const oracleSources = [
  {
    label: 'ISIN',
    value: 'isin',
  },
  {
    label: 'Asset specific',
    value: 'assetSpecific',
  },
]

const linearPricingOptions = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
]

export const maturityOptions = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Fixed with extension', value: 'fixedWithExtension' },
  { label: 'Open-end', value: 'none' },
]

export const LiquidAssetsForm = () => {
  const theme = useTheme()
  const { selectedPool } = useAssetsContext()
  const form = useFormikContext<CreateAssetFormValues>()
  return (
    <Grid
      backgroundColor="backgroundSecondary"
      borderRadius={8}
      p={2}
      border={`1px solid ${theme.colors.borderPrimary}`}
      gap={2}
    >
      <Field name="oracleSource">
        {({ field, form }: FieldProps) => (
          <Select
            name="oracleSource"
            label="Oracle source"
            value={field.value}
            options={oracleSources}
            onChange={(event) => {
              form.setFieldValue('oracleSource', event.target.value)
            }}
          />
        )}
      </Field>
      {form.values.oracleSource === 'isin' && (
        <Field name="isin">
          {({ field, form }: FieldProps) => (
            <TextInput
              name="isin"
              label={<Tooltips type="isin" size="med" color={theme.colors.textPrimary} label="ISIN*" />}
              value={field.value}
              onChange={(event) => {
                form.setFieldValue('isin', event.target.value)
              }}
            />
          )}
        </Field>
      )}
      <Field name="notionalValue">
        {({ field, form }: FieldProps) => (
          <CurrencyInput
            name="notionalValue"
            label={
              <Tooltips type="notionalValue" size="med" color={theme.colors.textPrimary} label="Notional value*" />
            }
            value={field.value}
            onChange={(event) => {
              form.setFieldValue('notionalValue', event)
            }}
            currency={selectedPool?.currency.displayName}
          />
        )}
      </Field>
      <Field name="linearPricing">
        {({ field, form }: FieldProps) => (
          <Select
            name="linearPricing"
            label="With linear pricing?"
            value={field.value}
            options={linearPricingOptions}
            onChange={(event) => {
              form.setFieldValue('linearPricing', event.target.value)
            }}
          />
        )}
      </Field>
      <Field name="interestRate">
        {({ field, form }: FieldProps) => (
          <NumberInput
            name="interestRate"
            label={<Tooltips type="interestRate" size="med" color={theme.colors.textPrimary} label="Interest rate*" />}
            value={field.value}
            onChange={(event) => {
              form.setFieldValue('interestRate', event.target.value)
            }}
            symbol="%"
            placeholder="0.00"
          />
        )}
      </Field>
      <Field name="maturity">
        {({ field, form }: FieldProps) => (
          <Select
            name="maturity"
            label="Maturity"
            value={field.value}
            options={maturityOptions}
            onChange={(event) => {
              form.setFieldValue('maturity', event.target.value)
            }}
          />
        )}
      </Field>
      {(form.values.maturity === 'fixed' || form.values.maturity === 'fixedWithExtension') && (
        <>
          <Field name="maturityDate">
            {({ field, form }: FieldProps) => (
              <DateInput
                name="maturityDate"
                label="Maturity date*"
                value={field.value}
                onChange={(event) => {
                  form.setFieldValue('maturityDate', event.target.value)
                }}
              />
            )}
          </Field>
          {form.values.maturity === 'fixedWithExtension' && (
            <Field name="maturityExtensionDays">
              {({ field, form }: FieldProps) => (
                <NumberInput
                  name="maturityExtensionDays"
                  label={<Tooltips type="maturityExtensionDays" size="med" color={theme.colors.textPrimary} />}
                  symbol="days"
                  value={field.value}
                  onChange={(event) => {
                    form.setFieldValue('maturityExtensionDays', event.target.value)
                  }}
                />
              )}
            </Field>
          )}
        </>
      )}
    </Grid>
  )
}
