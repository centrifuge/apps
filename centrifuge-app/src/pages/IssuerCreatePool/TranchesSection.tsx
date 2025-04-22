import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { Box, CurrencyInput, Grid, InputErrorMessage, NumberInput, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../src/components/Tooltips'
import { validate } from './validate'

const apyOptions = [
  { value: 'target', label: 'Target' },
  { value: '7d', label: '7 day' },
  { value: '30d', label: '30 day' },
  { value: '90d', label: '90 day' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'inception', label: 'Since inception' },
]

export const StyledGrid = styled(Grid)`
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  padding: 40px;
  border: ${({ theme }) => `1px solid ${theme.colors.borderPrimary}`};
  border-radius: 8px;
  gap: 24px;
  @media (max-width: ${({ theme }) => theme.breakpoints.S}) {
    padding: 12px;
  }
`

export const Line = () => {
  const theme = useTheme()
  return <Box border={`.5px solid ${theme.colors.borderPrimary}`} width="100%" />
}

export const TranchesSection = ({ isUpdating }: { isUpdating?: boolean }) => {
  const form = useFormikContext<PoolMetadataInput>()
  const { values } = form
  const tranches = form.values.tranches

  const getTrancheName = (index: number, value?: string) => {
    switch (index) {
      case 0:
        return value ? `${value} Junior` : 'Junior'
      case 1:
        return values.tranches.length === 2
          ? value
            ? `${value} Senior`
            : 'Senior'
          : value
          ? `${value} Mezzanine`
          : 'Mezzanine'
      case 2:
        return value ? `${value} Senior` : 'Senior'
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
    <Box mt={isUpdating ? 0 : 4} mb={3}>
      {isUpdating ? <></> : <Text>Tranches</Text>}
      {tranches.map((_, index) => (
        <StyledGrid
          key={index}
          mt={isUpdating ? 0 : 3}
          px={isUpdating ? '16px !important' : 5}
          py={isUpdating ? '24px !important' : 5}
          mb={isUpdating ? '24px !important' : 3}
        >
          <Text variant="heading3">Tranche {index + 1}</Text>
          <Line />
          <Grid gridTemplateColumns={isUpdating ? ['1fr'] : ['1fr', '1fr 1fr']} gap={3}>
            <Box>
              <Field name={`tranches.${index}.tokenName`}>
                {({ field, form }: FieldProps) => (
                  <TextInput
                    {...field}
                    label="Token name"
                    placeholder={getTrancheName(index)}
                    maxLength={30}
                    name={`tranches.${index}.tokenName`}
                    disabled
                    value={isUpdating ? getTrancheName(index, field.value) : getTrancheName(index)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTrancheNameChange(e, index, form)}
                  />
                )}
              </Field>
              <Box mt={3}>
                <Field name={`tranches.${index}.minInvestment`} validate={validate.minInvestment}>
                  {({ field, form, meta }: FieldProps) => {
                    return (
                      <CurrencyInput
                        {...field}
                        label={
                          <Tooltips type="minimumInvestment" label={<Text variant="heading4">Min. investment*</Text>} />
                        }
                        placeholder="0.00"
                        currency={values.assetDenomination}
                        errorMessage={meta.touched ? meta.error : undefined}
                        onChange={(value) => form.setFieldValue(field.name, value)}
                        onBlur={() => form.setFieldTouched(field.name, true)}
                      />
                    )
                  }}
                </Field>
              </Box>
            </Box>

            <Box>
              <Field name={`tranches.${index}.symbolName`} validate={validate.symbolName}>
                {({ field, form, meta }: FieldProps) => (
                  <Box position="relative">
                    <TextInput
                      {...field}
                      onChange={(e) => form.setFieldValue(field.name, e.target.value)}
                      label={<Tooltips type="tokenSymbol" label={<Text variant="heading4">Token symbol*</Text>} />}
                      placeholder="4-12 characters"
                      minLength={4}
                      maxLength={12}
                    />
                    {meta.touched ? (
                      <InputErrorMessage style={{ position: 'absolute' }}>{meta.error}</InputErrorMessage>
                    ) : null}
                  </Box>
                )}
              </Field>

              <Box mt={3}>
                {index === 0 ? (
                  <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3}>
                    <Field name={`tranches.${index}.apy`} validate={validate.apy}>
                      {({ field, meta, form }: FieldProps) => (
                        <Select
                          label={<Tooltips type="apy" label={<Text variant="heading4">APY</Text>} />}
                          onChange={(event) => form.setFieldValue(field.name, event.target.value)}
                          onBlur={field.onBlur}
                          errorMessage={meta.touched && meta.error ? meta.error : undefined}
                          value={field.value}
                          options={apyOptions}
                          placeholder="Select..."
                        />
                      )}
                    </Field>
                    <Box mt={[0, 3]}>
                      <FieldWithErrorMessage
                        as={NumberInput}
                        placeholder="0.00"
                        symbol="%"
                        name={`tranches.${index}.apyPercentage`}
                        validate={isUpdating ? undefined : validate.apyPercentage}
                      />
                    </Box>
                  </Grid>
                ) : (
                  <FieldWithErrorMessage
                    as={NumberInput}
                    label={
                      <Tooltips type="tranchProtection" label={<Text variant="heading4">Min. subordination</Text>} />
                    }
                    placeholder="0.00"
                    symbol="%"
                    name={`tranches.${index}.minRiskBuffer`}
                    validate={isUpdating ? undefined : validate.minRiskBuffer}
                  />
                )}
              </Box>
            </Box>

            {index === 0 && (
              <Box>
                <FieldWithErrorMessage
                  as={NumberInput}
                  placeholder="0.00"
                  symbol="%"
                  name={`tranches.${index}.weightedAverageMaturity`}
                  label={<Text variant="heading4">Weighted Average Maturity</Text>}
                />
              </Box>
            )}

            {index !== 0 && (
              <>
                <Box>
                  <Field name={`tranches.${index}.interestRate`} validate={validate.interestRate}>
                    {({ field, form, meta }: FieldProps) => (
                      <FieldWithErrorMessage
                        {...field}
                        label={
                          <Tooltips
                            type="fixedTranchInterest"
                            label={<Text variant="heading4">Fixed interest rate</Text>}
                          />
                        }
                        placeholder="0.00"
                        errorMessage={meta.touched ? meta.error : undefined}
                        onBlur={() => form.setFieldTouched(field.name, true)}
                        symbol="%"
                        as={NumberInput}
                      />
                    )}
                  </Field>
                </Box>
                <Box width="227px">
                  <Field name={`tranches.${index}.apy`}>
                    {({ field }: FieldProps) => (
                      <TextInput
                        {...field}
                        label={
                          <Tooltips
                            type="apy"
                            label={
                              <Text variant="heading4" color="textSecondary">
                                APY
                              </Text>
                            }
                          />
                        }
                        name={`tranches.${index}.apy`}
                        disabled
                        value={apyOptions.find((option) => option.value === values.tranches[0].apy)?.label}
                      />
                    )}
                  </Field>
                </Box>
              </>
            )}
          </Grid>
        </StyledGrid>
      ))}
    </Box>
  )
}
