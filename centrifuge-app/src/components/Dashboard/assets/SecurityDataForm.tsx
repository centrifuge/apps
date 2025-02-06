import { DateInput, Grid, NumberInput, Select } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import { useTheme } from 'styled-components'

const securityTypesOptions = [
  { label: 'Fixed income', value: 'fixedIncome' },
  { label: 'Equity', value: 'equity' },
  { label: 'Credit', value: 'credit' },
]

const termOptions = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Fixed with extension', value: 'fixedWithExtension' },
  { label: 'Open-end', value: 'none' },
]

export const SecurityDataForm = () => {
  const theme = useTheme()
  return (
    <Grid
      backgroundColor="backgroundSecondary"
      borderRadius={8}
      p={2}
      border={`1px solid ${theme.colors.borderPrimary}`}
      gap={2}
    >
      <Field name="securityType">
        {({ field, form }: FieldProps) => (
          <Select
            name="securityType"
            label="Security type"
            value={field.value}
            options={securityTypesOptions}
            onChange={(event) => {
              form.setFieldValue('securityType', event.target.value)
            }}
          />
        )}
      </Field>
      <Field name="coupon">
        {({ field, form }: FieldProps) => (
          <NumberInput
            name="coupon"
            label="Coupon"
            value={field.value}
            onChange={(event) => {
              form.setFieldValue('coupon', event.target.value)
            }}
            symbol="%"
            placeholder="0.0"
          />
        )}
      </Field>
      <Field name="issueDate">
        {({ field, form }: FieldProps) => (
          <DateInput
            name="issueDate"
            label="Issue date*"
            value={field.value}
            onChange={(event) => {
              form.setFieldValue('issueDate', event.target.value)
            }}
          />
        )}
      </Field>
      <Field name="term">
        {({ field, form }: FieldProps) => (
          <Select
            name="term"
            label="Term"
            value={field.value}
            options={termOptions}
            onChange={(event) => {
              form.setFieldValue('term', event.target.value)
            }}
          />
        )}
      </Field>
    </Grid>
  )
}
