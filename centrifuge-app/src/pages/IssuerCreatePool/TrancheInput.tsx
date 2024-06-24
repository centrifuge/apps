import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import {
  Box,
  Button,
  CurrencyInput,
  Grid,
  IconMinusCircle,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import { createEmptyTranche } from '.'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { Tooltips } from '../../components/Tooltips'
import { validate } from './validate'

const MAX_TRANCHES = 3

export const TrancheSection: React.FC = () => {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values, setFieldValue } = fmk

  const getNewTrancheName = (numTranches: number) => {
    switch (numTranches) {
      case 0:
        return 'Junior' // First tranche to be added
      case 1:
        return 'Senior' // Second tranche
      case 2:
        return 'Mezzanine' // Third tranche
      default:
        return '' // No more tranches allowed or needed
    }
  }

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
                const newTrancheName = getNewTrancheName(values.tranches.length)
                if (values.tranches.length === 2) {
                  const updatedItems = values.tranches
                  updatedItems.splice(1, 0, createEmptyTranche(newTrancheName))
                  setFieldValue('tranches', updatedItems)
                } else {
                  fldArr.push(createEmptyTranche(newTrancheName))
                }
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
                  label="Token name"
                  placeholder={index === juniorTrancheIndex ? values.poolName : ''}
                  maxLength={30}
                  name={`tranches.${index}.tokenName`}
                  disabled
                  value={values.tranches.length === 1 ? values.poolName : s.tokenName}
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
                <Field name={`tranches.${index}.minInvestment`} validate={validate.minInvestment}>
                  {({ field, form, meta }: FieldProps) => (
                    <CurrencyInput
                      {...field}
                      label={<Tooltips type="minimumInvestment" variant="secondary" label="Min. investment*" />}
                      placeholder="0.00"
                      currency={values.currency}
                      errorMessage={meta.touched ? meta.error : undefined}
                      onChange={(value) => form.setFieldValue(field.name, value)}
                      onBlur={() => form.setFieldTouched(field.name, true)}
                    />
                  )}
                </Field>
                {index === juniorTrancheIndex ? (
                  <>
                    <TextInput
                      label={<Tooltips type="noTranchProtection" variant="secondary" />}
                      value="-"
                      symbol="%"
                      disabled
                    />
                    <TextInput
                      label={<Tooltips type="variableTranchInterest" variant="secondary" />}
                      value="-"
                      symbol="%"
                      disabled
                    />
                  </>
                ) : (
                  <>
                    <FieldWithErrorMessage
                      as={NumberInput}
                      label={<Tooltips type="tranchProtection" variant="secondary" />}
                      placeholder="0.00"
                      symbol="%"
                      name={`tranches.${index}.minRiskBuffer`}
                      validate={validate.minRiskBuffer}
                    />
                    <FieldWithErrorMessage
                      as={NumberInput}
                      label={<Tooltips type="fixedTranchInterest" variant="secondary" />}
                      placeholder="0.00"
                      symbol="%"
                      name={`tranches.${index}.interestRate`}
                      validate={validate.interestRate}
                    />
                  </>
                )}
                {canRemove && (
                  <Box pt={1}>
                    {index !== juniorTrancheIndex && (
                      <Button
                        variant="tertiary"
                        icon={IconMinusCircle}
                        onClick={() => {
                          // removes always mezzanine first and then senior to maintain order Junior | Senior or Junior | Mezzanine | Senior
                          fldArr.remove(1)
                        }}
                      />
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
