import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Button, Grid, IconMinusCircle, NumberInput, Stack, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import React from 'react'
import { createEmptyTranche } from '.'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { Tooltips } from '../../components/Tooltips'
import { useCurrencies } from '../../utils/useCurrencies'
import { validate } from './validate'

const MAX_TRANCHES = 5

export const TrancheSection: React.FC = () => {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk

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
          <TrancheInput canRemove />
        </PageSection>
      )}
    </FieldArray>
  )
}

export const TrancheInput: React.FC<{ canRemove?: boolean; currency?: string; isUpdating?: boolean }> = ({
  canRemove,
  currency,
  isUpdating,
}) => {
  const fmk = useFormikContext<PoolMetadataInput>()
  const currencies = useCurrencies()
  const { values } = fmk

  const juniorTrancheIndex = 0 // the first tranche is the most junior in the UI

  return (
    <FieldArray name="tranches">
      {(fldArr) => (
        <Grid
          gridTemplateColumns={canRemove ? '40px 1fr 1fr 1fr 1fr 1fr 40px' : '40px 1fr 1fr 1fr 1fr 1fr'}
          gap={2}
          rowGap={3}
        >
          {values.tranches
            .map((s, index) => (
              <React.Fragment key={index}>
                <Stack gap="4px" py={1} alignItems="center" justifyContent="center">
                  <Text variant="body1">{index + 1}</Text>
                </Stack>
                <FieldWithErrorMessage
                  as={TextInput}
                  label="Token name*"
                  placeholder={index === juniorTrancheIndex ? 'Junior' : ''}
                  maxLength={30}
                  name={`tranches.${index}.tokenName`}
                  validate={validate.tokenName}
                  disabled={isUpdating}
                />
                <Field name={`tranches.${index}.symbolName`} validate={validate.symbolName}>
                  {({ field, form, meta }: FieldProps) => (
                    <TextInput
                      {...field}
                      onChange={(e) => form.setFieldValue(field.name, e.target.value)}
                      errorMessage={meta.touched ? meta.error : undefined}
                      label={<Tooltips type="tokenSymbol" label="Token symbol*" variant="secondary" />}
                      placeholder="4-12 characters"
                      minLength={4}
                      maxLength={12}
                      disabled={isUpdating}
                    />
                  )}
                </Field>
                <FieldWithErrorMessage
                  as={NumberInput}
                  label={<Tooltips type="minimumInvestment" variant="secondary" label="Min. investment*" />}
                  placeholder="0.00"
                  name={`tranches.${index}.minInvestment`}
                  validate={validate.minInvestment}
                  rightElement={currencies.find((c) => c.value === (currency || values.currency))?.label}
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
                {canRemove && (
                  <Box pt={1}>
                    {index !== juniorTrancheIndex && (
                      <Button variant="tertiary" icon={IconMinusCircle} onClick={() => fldArr.remove(index)} />
                    )}
                  </Box>
                )}
              </React.Fragment>
            ))
            .reverse()}
        </Grid>
      )}
    </FieldArray>
  )
}
