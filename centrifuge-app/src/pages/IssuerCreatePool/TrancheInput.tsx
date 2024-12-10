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
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { Tooltips } from '../../components/Tooltips'
import { createEmptyTranche } from './types'
import { validate } from './validate'

const MAX_TRANCHES = 3

export function TrancheSection() {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values, setFieldValue } = fmk

  const getNewTrancheName = (numTranches: number, poolName: string) => {
    switch (numTranches) {
      case 0:
        return `${poolName} Junior`
      case 1:
        return `${poolName} Senior`
      case 2:
        return `${poolName} Mezzanine`
      default:
        return ''
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
                const newTrancheName = getNewTrancheName(values.tranches.length, values.poolName)
                if (values.tranches.length === 2) {
                  const updatedItems = values.tranches
                  updatedItems.splice(1, 0, createEmptyTranche(newTrancheName))
                  setFieldValue('tranches', updatedItems)
                } else {
                  fldArr.push(createEmptyTranche(newTrancheName))
                }
                // Update the name of the first tranche when the second tranche is added
                if (values.tranches.length === 1) {
                  setFieldValue('tranches.0.tokenName', `${values.poolName} Junior`)
                }
              }}
              small
              disabled={values.tranches.length >= MAX_TRANCHES}
            >
              Add another
            </Button>
          }
        >
          <TrancheInput canRemove poolName={values.poolName} />
        </PageSection>
      )}
    </FieldArray>
  )
}

export function TrancheInput({
  canRemove,
  isUpdating,
  poolName,
}: {
  canRemove?: boolean
  isUpdating?: boolean
  poolName?: string
}) {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk

  const getTrancheName = (index: number) => {
    if (values.tranches.length === 1) {
      return poolName
    }
    switch (index) {
      case 0:
        return `${poolName} Junior`
      case 1:
        return values.tranches.length === 2 ? `${poolName} Senior` : `${poolName} Mezzanine`
      case 2:
        return `${poolName} Senior`
      default:
        return ''
    }
  }

  const handleTrancheNameChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, form: any) => {
    const newValue = e.target.value
    const poolName = values.poolName
    const suffix = newValue.startsWith(poolName) ? newValue.substring(poolName.length).trim() : newValue
    form.setFieldValue(`tranches.${index}.tokenName`, `${poolName} ${suffix}`)
  }

  return (
    <FieldArray name="tranches">
      {(fldArr) => (
        <Grid
          gridTemplateColumns={canRemove ? '40px 1.5fr 1fr 1fr .5fr .5fr 40px' : '40px 1.5fr 1fr 1fr .5fr .5fr'}
          gap={2}
          rowGap={3}
        >
          {values.tranches
            .map((s, index) => (
              <React.Fragment key={index}>
                <Stack gap="4px" py={1} alignItems="center" justifyContent="center">
                  <Text variant="body1">{index + 1}</Text>
                </Stack>
                <Field name={`tranches.${index}.tokenName`}>
                  {({ field, form }: FieldProps) => (
                    <TextInput
                      {...field}
                      label="Token name"
                      placeholder={getTrancheName(index)}
                      maxLength={30}
                      name={`tranches.${index}.tokenName`}
                      disabled={values.tranches.length === 1}
                      value={getTrancheName(index)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTrancheNameChange(e, index, form)}
                    />
                  )}
                </Field>
                <Field name={`tranches.${index}.symbolName`} validate={validate.symbolName}>
                  {({ field, form, meta }: FieldProps) => (
                    <TextInput
                      {...field}
                      onChange={(e) => form.setFieldValue(field.name, e.target.value)}
                      errorMessage={meta.touched ? meta.error : undefined}
                      label={<Tooltips type="tokenSymbol" label="Token symbol*" />}
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
                      label={<Tooltips type="minimumInvestment" label="Min. investment*" />}
                      placeholder="0.00"
                      currency={values.currency}
                      errorMessage={meta.touched ? meta.error : undefined}
                      onChange={(value) => form.setFieldValue(field.name, value)}
                      onBlur={() => form.setFieldTouched(field.name, true)}
                    />
                  )}
                </Field>
                {index === 0 ? (
                  <>
                    {/* Only most junior tranche has target APY */}
                    <FieldWithErrorMessage
                      as={NumberInput}
                      label={<Tooltips type="targetAPY" />}
                      placeholder="0.00"
                      symbol="%"
                      name={`tranches.${index}.targetAPY`}
                      validate={validate.interestRate}
                    />
                  </>
                ) : (
                  <>
                    {/* Show min subordination and interest rate for Senior or Mezzanine tranches */}
                    <FieldWithErrorMessage
                      as={NumberInput}
                      label={<Tooltips type="tranchProtection" />}
                      placeholder="0.00"
                      symbol="%"
                      name={`tranches.${index}.minRiskBuffer`}
                      validate={validate.minRiskBuffer}
                    />
                    <FieldWithErrorMessage
                      as={NumberInput}
                      label={<Tooltips type="fixedTranchInterest" />}
                      placeholder="0.00"
                      symbol="%"
                      name={`tranches.${index}.interestRate`}
                      validate={validate.interestRate}
                    />
                  </>
                )}

                {canRemove && (
                  <Box pt={1}>
                    {index !== 0 && (
                      <Button
                        variant="tertiary"
                        icon={IconMinusCircle}
                        onClick={() => {
                          fldArr.remove(index)
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
