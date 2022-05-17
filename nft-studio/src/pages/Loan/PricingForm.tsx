import { Balance, Loan as LoanType, LoanInfoInput, Pool, Rate } from '@centrifuge/centrifuge-js'
import { Button, DateInput, Grid, NumberInput, Select, Stack } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { PageSummary } from '../../components/PageSummary'
import { getCurrencySymbol } from '../../utils/formatting'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { usePoolMetadata } from '../../utils/usePools'
import { combine, max, positiveNumber, required } from '../../utils/validation'
import { RiskGroupValues } from './RiskGroupValues'
import { LOAN_FIELDS, LOAN_TYPE_LABELS } from './utils'

type PricingFormValues = {
  loanType: 'BulletLoan' | 'CreditLine' | 'CreditLineWithMaturity'
  value: number | string
  maturityDate: string
  riskGroup: string
}

export const PricingForm: React.VFC<{ loan: LoanType; pool: Pool }> = ({ loan, pool }) => {
  const { execute: doTransaction, isLoading } = useCentrifugeTransaction(
    'Price asset',
    (cent) => cent.pools.priceLoan as any
  )
  const { data: metadata, isLoading: metadataIsLoading } = usePoolMetadata(pool)

  const riskGroupOptions =
    metadata?.riskGroups?.map((r, i) => ({ value: i.toString(), label: r.name ?? `Risk group ${i + 1}` })) ?? []

  React.useEffect(() => {
    if (riskGroupOptions.length) {
      form.setFieldValue('riskGroup', '0', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata])

  const form = useFormik<PricingFormValues>({
    initialValues: {
      loanType: 'CreditLineWithMaturity',
      riskGroup: '',
      value: '',
      maturityDate: '',
    },
    onSubmit: (values, { setSubmitting }) => {
      if (!riskGroup) return
      const value = Balance.fromFloat(values.value)
      const maturityDate = new Date(form.values.maturityDate).toISOString()
      const ratePerSec = fee!

      let loanInfo: LoanInfoInput
      switch (values.loanType) {
        case 'CreditLine':
          loanInfo = {
            type: values.loanType,
            value,
            advanceRate: advanceRate!,
          }
          break
        default:
          loanInfo = {
            type: values.loanType,
            value,
            advanceRate: advanceRate!,
            probabilityOfDefault: probabilityOfDefault!,
            lossGivenDefault: lossGivenDefault!,
            discountRate: discountRate!,
            maturityDate,
          }
      }

      doTransaction([loan.poolId, loan.id, ratePerSec, loanInfo])
      setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<PricingFormValues> = {}

      if (shownFields.includes('maturityDate')) {
        if (!values.maturityDate) {
          errors.maturityDate = 'Required'
        } else if (!/\d{4}-\d{2}-\d{2}/.test(values.maturityDate)) {
          // Date input not natively supported, let user enter manually in required format
          errors.maturityDate = 'Maturity date must be in format yyyy-mm-dd'
        } else if (new Date(values.maturityDate) < new Date()) {
          errors.maturityDate = 'Maturity date must be in the future'
        }
      }
      return errors
    },
    validateOnMount: true,
  })

  const shownFields = LOAN_FIELDS[form.values.loanType]

  const fields = {
    value: (
      <FieldWithErrorMessage
        key="value"
        as={NumberInput}
        label="Value"
        min="0"
        placeholder="0.00"
        name="value"
        rightElement={getCurrencySymbol(pool.currency)}
        validate={combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER))}
      />
    ),
    maturityDate: (
      <FieldWithErrorMessage
        key="maturityDate"
        as={DateInput}
        label="Maturity date"
        type="date"
        min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
        name="maturityDate"
      />
    ),
  }

  const riskGroup = metadata?.riskGroups?.[Number(form.values.riskGroup)]

  const advanceRate = riskGroup?.advanceRate ? new Rate(riskGroup.advanceRate) : undefined
  const fee = riskGroup?.interestRatePerSec ? new Rate(riskGroup.interestRatePerSec) : undefined
  const probabilityOfDefault = riskGroup?.probabilityOfDefault ? new Rate(riskGroup.probabilityOfDefault) : undefined
  const lossGivenDefault = riskGroup?.lossGivenDefault ? new Rate(riskGroup.lossGivenDefault) : undefined
  const discountRate = riskGroup?.discountRate ? new Rate(riskGroup.discountRate) : undefined

  return (
    <FormikProvider value={form}>
      <Form noValidate>
        <PageSummary
          data={[
            { label: 'Loan type', value: LOAN_TYPE_LABELS[form.values.loanType] },
            { label: 'Collateral value', value: 'n/a' },
            { label: 'Risk group', value: 'n/a' },
          ]}
        />
        <PageSection
          title="Pricing"
          headerRight={
            <Button type="submit" disabled={!riskGroup} loading={isLoading} small>
              Price
            </Button>
          }
        >
          <Stack gap={3}>
            <Grid columns={[1, 3]} equalColumns gap={3}>
              {Object.entries(fields)
                .filter(([key]) => shownFields.includes(key))
                .map(([, el]) => el)}

              <Field name="riskGroup">
                {({ field, meta, form }: FieldProps) => (
                  <Select
                    label="Risk group"
                    onSelect={(v) => form.setFieldValue('riskGroup', v, false)}
                    onBlur={field.onBlur}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    value={field.value}
                    options={riskGroupOptions}
                    placeholder=""
                    disabled={metadataIsLoading}
                  />
                )}
              </Field>
            </Grid>
            {riskGroup && <RiskGroupValues values={riskGroup} loanType={form.values.loanType} />}
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
