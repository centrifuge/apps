import { CurrencyInput, DateInput, Grid, NumberInput, Select } from '@centrifuge/fabric'
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
  console.log('values.pricing.valuationMethod', values.pricing.valuationMethod)
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
            ]}
            placeholder="Choose valuation method"
          />
        )}
      </Field>
      <Field name="pricing.maxBorrowAmount">
        {({ field, meta, form }: FieldProps) => (
          <Select
            {...field}
            label="Borrow restriction"
            onChange={(event) => form.setFieldValue('pricing.maxBorrowAmount', event.target.value, false)}
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
            options={[
              { value: 'upToTotalBorrowed', label: 'upToTotalBorrowed' },
              { value: 'upToOutstandingDebt', label: 'upToOutstandingDebt' },
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
      <FieldWithErrorMessage
        as={DateInput}
        validate={required()}
        name="pricing.maturityDate"
        label="Maturity date*"
        type="date"
        min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
        max={new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
      />
      <FieldWithErrorMessage
        as={NumberInput}
        label={<Tooltips type="financingFee" variant="secondary" label="Financing fee*" />}
        placeholder="0.00"
        rightElement="%"
        name="pricing.interestRate"
        validate={validate.fee}
      />

      <FieldWithErrorMessage
        as={NumberInput}
        label={<Tooltips type="advanceRate" variant="secondary" label="Advance rate*" />}
        placeholder="0.00"
        rightElement="%"
        name="pricing.advanceRate"
        validate={validate.advanceRate}
      />
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
          {/* <TextInput
            label={<Tooltips type="riskAdjustment" variant="secondary" />}
            disabled
            value={Math.max(
              Math.min(
                (Number(values.pricing.probabilityOfDefault) / 100) *
                  (Number(values.pricing.lossGivenDefault) / 100) *
                  100,
                100
              ),
              0
            ).toFixed(2)}
            rightElement="%"
          /> */}
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
