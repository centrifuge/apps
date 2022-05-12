import { Box, Button, Grid, IconMinusCircle, NumberInput, Stack, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import React from 'react'
import { createEmptyTranche, CURRENCIES, PoolFormValues } from '.'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { validate } from './validate'

const MAX_TRANCHES = 5

export const TrancheInput: React.FC = () => {
  const fmk = useFormikContext<PoolFormValues>()
  const { values } = fmk

  const juniorTrancheIndex = 0 // the first tranche is the most junior in the UI

  return (
    <FieldArray name="tranches">
      {(fldArr) => (
        <PageSection
          title="Tranches"
          subtitle="At least one tranche is required"
          headerRight={
            <Button
              variant="secondary"
              onClick={() => {
                fldArr.push(createEmptyTranche())
              }}
              small
              disabled={values.tranches.length >= MAX_TRANCHES}
            >
              Add another
            </Button>
          }
        >
          <Grid gridTemplateColumns="64px 2fr 1fr 1.5fr 1fr 1fr 40px" gap={2} rowGap={3}>
            {values.tranches
              .map((s, index) => (
                <React.Fragment key={index}>
                  <Stack gap="4px" py={1}>
                    <Text variant="label2">Seniority</Text>
                    <Text variant="body1">{index + 1}</Text>
                  </Stack>
                  <FieldWithErrorMessage
                    as={TextInput}
                    label="Name"
                    placeholder={index === juniorTrancheIndex ? 'Junior' : ''}
                    maxLength={30}
                    name={`tranches.${index}.tokenName`}
                    validate={validate.tokenName}
                  />
                  <Field name={`tranches.${index}.symbolName`} validate={validate.symbolName}>
                    {({ field, form, meta }: FieldProps) => (
                      <TextInput
                        {...field}
                        onChange={(e) => form.setFieldValue(field.name, e.target.value.toUpperCase())}
                        errorMessage={meta.touched ? meta.error : undefined}
                        label="Token symbol"
                        placeholder=""
                        maxLength={6}
                      />
                    )}
                  </Field>
                  <FieldWithErrorMessage
                    as={NumberInput}
                    label="Min. investment amount"
                    placeholder="0.00"
                    name={`tranches.${index}.minInvestment`}
                    validate={validate.minInvestment}
                    rightElement={CURRENCIES.find((c) => c.value === values.currency)?.label}
                  />
                  {index === juniorTrancheIndex ? (
                    <>
                      <TextInput label="Min. protection" value="-" rightElement="%" disabled />
                      <TextInput label="Interest rate" value="-" rightElement="%" disabled />
                    </>
                  ) : (
                    <>
                      <FieldWithErrorMessage
                        as={NumberInput}
                        label="Min. protection"
                        placeholder="0.00"
                        rightElement="%"
                        name={`tranches.${index}.minRiskBuffer`}
                        validate={validate.minRiskBuffer}
                      />
                      <FieldWithErrorMessage
                        as={NumberInput}
                        label="Fixed interest"
                        placeholder="0.00"
                        rightElement="%"
                        name={`tranches.${index}.interestRate`}
                        validate={validate.interestRate}
                      />
                    </>
                  )}
                  <Box p={1}>
                    {index !== juniorTrancheIndex && (
                      <Button variant="tertiary" icon={IconMinusCircle} onClick={() => fldArr.remove(index)} />
                    )}
                  </Box>
                </React.Fragment>
              ))
              .reverse()}
          </Grid>
        </PageSection>
      )}
    </FieldArray>
  )
}
