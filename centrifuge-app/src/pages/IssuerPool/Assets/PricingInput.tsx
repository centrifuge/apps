import { CurrencyInput, DateInput, Grid, NumberInput, Select, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { Tooltips } from '../../../components/Tooltips'
import { usePool } from '../../../utils/usePools'
import { combine, max, positiveNumber, required } from '../../../utils/validation'
import { validate } from '../../IssuerCreatePool/validate'
import { CreateLoanFormValues } from './CreateLoan'

export function PricingInput({ poolId }: { poolId: string }) {
  const { values } = useFormikContext<CreateLoanFormValues>()
  const pool = usePool(poolId)
  return (
    <Grid columns={[1, 2, 2, 3]} gap={2} rowGap={3}>
      <Field name="pricing.valuationMethod">
        {({ field, meta, form }: FieldProps) => (
          <Select
            {...field}
            label="Valuation method"
            onChange={(event) => form.setFieldValue('pricing.valuationMethod', event.target.value, false)}
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
            options={[
              { value: 'discountedCashFlow', label: 'Discounted cashflow' },
              { value: 'outstandingDebt', label: 'Outstanding debt' },
              { value: 'oracle', label: 'Oracle' },
            ]}
            placeholder="Choose valuation method"
          />
        )}
      </Field>
      {values.pricing.valuationMethod === 'oracle' && (
        <>
          {/* <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="financingFee" variant="secondary" label="Max quantity*" />}
            placeholder="0"
            name="pricing.maxBorrowQuantity"
            validate={validate.maxBorrowQuantity}
          /> */}
          <FieldWithErrorMessage
            as={TextInput}
            label={<Tooltips type="financingFee" variant="secondary" label="ISIN*" />}
            placeholder="010101010000"
            name="pricing.Isin"
            validate={validate.Isin}
          />
          <Field name="pricing.notional" validate={combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER))}>
            {({ field, meta, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                label="Notional*"
                placeholder="0.00"
                errorMessage={meta.touched ? meta.error : undefined}
                currency={pool?.currency.symbol}
                onChange={(value) => form.setFieldValue('pricing.notional', value)}
                variant="small"
              />
            )}
          </Field>
        </>
      )}

      {(values.pricing.valuationMethod === 'discountedCashFlow' ||
        values.pricing.valuationMethod === 'outstandingDebt') && (
        <>
          <Field name="pricing.maxBorrowAmount">
            {({ field, meta, form }: FieldProps) => (
              <Select
                {...field}
                label="Borrow restriction"
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
                variant="small"
              />
            )}
          </Field>
        </>
      )}
      <FieldWithErrorMessage
        as={DateInput}
        validate={required()}
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
        rightElement="days"
        name="pricing.maturityExtensionDays"
        validate={validate.maturityExtensionDays}
      />

      <FieldWithErrorMessage
        as={NumberInput}
        label={<Tooltips type="financingFee" variant="secondary" label="Financing fee*" />}
        placeholder="0.00"
        rightElement="%"
        name="pricing.interestRate"
        validate={validate.fee}
      />
      {(values.pricing.valuationMethod === 'discountedCashFlow' ||
        values.pricing.valuationMethod === 'outstandingDebt') && (
        <>
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="advanceRate" variant="secondary" label="Advance rate*" />}
            placeholder="0.00"
            rightElement="%"
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
            rightElement="%"
            name="pricing.probabilityOfDefault"
            validate={validate.probabilityOfDefault}
          />
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="lossGivenDefault" variant="secondary" label="Loss given default*" />}
            placeholder="0.00"
            rightElement="%"
            name="pricing.lossGivenDefault"
            validate={validate.lossGivenDefault}
          />
          <FieldWithErrorMessage
            as={NumberInput}
            label={<Tooltips type="discountRate" variant="secondary" label="Discount rate*" />}
            placeholder="0.00"
            rightElement="%"
            name="pricing.discountRate"
            validate={validate.discountRate}
          />
        </>
      )}
    </Grid>
  )
}
