import { CurrencyBalance, Loan as LoanType, LoanInfoInput, Pool, Rate } from '@centrifuge/centrifuge-js'
import { Button, Card, CurrencyInput, DateInput, Grid, Select, Stack, Text } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { getCurrencySymbol } from '../../utils/formatting'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePoolMetadata } from '../../utils/usePools'
import { combine, max, positiveNumber, required } from '../../utils/validation'
import { RiskGroupValues } from './RiskGroupValues'
import { LOAN_FIELDS, LOAN_TYPE_LABELS } from './utils'

type PricingFormValues = {
  loanType: 'BulletLoan' | 'CreditLine' | 'CreditLineWithMaturity'
  value: number | ''
  maturityDate: string
  riskGroup: string
}

const loanTypeOptions = Object.entries(LOAN_TYPE_LABELS).map(([value, label]) => ({
  label,
  value,
}))

export const PricingForm: React.VFC<{ loan: LoanType; pool: Pool }> = ({ loan, pool }) => {
  const { execute: doTransaction, isLoading } = useCentrifugeTransaction(
    'Price asset',
    (cent) => cent.pools.priceLoan as any
  )
  const { data: metadata, isLoading: metadataIsLoading } = usePoolMetadata(pool)

  const riskGroupOptions =
    metadata?.riskGroups?.map((r, i) => ({
      value: i.toString(),
      label: r.name ? `${i + 1} – ${r.name}` : `Risk group ${i + 1}`,
    })) ?? []

  const form = useFormik<PricingFormValues>({
    initialValues: {
      loanType: 'CreditLineWithMaturity',
      riskGroup: '',
      value: '',
      maturityDate: '',
    },
    onSubmit: (values, { setSubmitting }) => {
      if (!riskGroup) return
      const value = CurrencyBalance.fromFloat(values.value, pool.currencyDecimals)
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
      const today = new Date()
      const dateIn5Years = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate())

      if (shownFields.includes('maturityDate')) {
        if (!values.maturityDate) {
          errors.maturityDate = 'Required'
        } else if (!/\d{4}-\d{2}-\d{2}/.test(values.maturityDate)) {
          // Date input not natively supported, let user enter manually in required format
          errors.maturityDate = 'Maturity date must be in format yyyy-mm-dd'
        } else if (new Date(values.maturityDate) < today) {
          errors.maturityDate = 'Maturity date must be in the future'
        } else if (new Date(values.maturityDate) > dateIn5Years) {
          errors.maturityDate = `Maturity date must not exceed 5 years (${dateIn5Years.toLocaleDateString()})`
        }
      }
      return errors
    },
    validateOnMount: true,
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  const shownFields = LOAN_FIELDS[form.values.loanType]

  const fields = {
    value: (
      <Field key="value" name="value" validate={combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER))}>
        {({ field, meta }: FieldProps) => {
          return (
            <CurrencyInput
              {...field}
              variant="small"
              label="Collateral value*"
              errorMessage={meta.touched ? meta.error : undefined}
              currency={getCurrencySymbol(pool?.currency)}
              placeholder="0.00"
              name="value"
              onChange={(value) => form.setFieldValue('value', value)}
            />
          )
        }}
      </Field>
    ),
    maturityDate: (
      <FieldWithErrorMessage
        key="maturityDate"
        as={DateInput}
        label="Maturity date*"
        type="date"
        min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
        max={new Date(365 * Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
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
      <Form noValidate ref={formRef}>
        <Stack as={Card} gap={2} p={2}>
          <Text variant="heading3">Pricing</Text>
          <Field name="loanType">
            {({ field, meta, form }: FieldProps) => (
              <Select
                label="Loan type"
                onSelect={(v) => form.setFieldValue('loanType', v, false)}
                onBlur={field.onBlur}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                value={field.value}
                options={loanTypeOptions}
                placeholder=""
              />
            )}
          </Field>
          {Object.entries(fields)
            .filter(([key]) => shownFields.includes(key))
            .map(([, el]) => el)}

          <Field name="riskGroup" validate={required()}>
            {({ field, meta, form }: FieldProps) => (
              <Select
                label="Risk group"
                onSelect={(v) => form.setFieldValue('riskGroup', v, false)}
                onBlur={field.onBlur}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                value={field.value}
                options={riskGroupOptions}
                placeholder="Select..."
                disabled={metadataIsLoading}
              />
            )}
          </Field>
          {riskGroup && (
            <Stack gap={2} px={2}>
              <Text variant="heading4">
                Risk group{' '}
                {riskGroup.name
                  ? `${Number(form.values.riskGroup) + 1} – ${riskGroup.name}`
                  : `Risk group ${Number(form.values.riskGroup) + 1}`}{' '}
              </Text>
              <Grid columns={2} equalColumns gap={2}>
                <RiskGroupValues values={riskGroup} loanType={form.values.loanType} />
              </Grid>
            </Stack>
          )}

          <Stack px={2} py={1}>
            <Button type="submit" loading={isLoading} loadingMessage={isLoading ? 'Pending...' : undefined}>
              Price
            </Button>
          </Stack>
        </Stack>
      </Form>
    </FormikProvider>
  )
}
