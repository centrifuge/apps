import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import {
  Box,
  Checkbox,
  CurrencyInput,
  Grid,
  IconHelpCircle,
  NumberInput,
  Select,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { Tooltips, tooltipText } from '../../../src/components/Tooltips'
import { config } from '../../config'
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

const ASSET_CLASSES = Object.keys(config.assetClasses).map((key) => ({
  label: key,
  value: key,
}))

export const CheckboxOption = ({
  name,
  label,
  value,
  disabled = false,
  icon,
  sublabel,
  id,
  height,
  styles,
}: {
  name: string
  label: string
  sublabel?: string
  value: string | number | boolean
  disabled?: boolean
  icon?: React.ReactNode
  id?: keyof typeof tooltipText
  height?: number
  styles?: React.CSSProperties
}) => {
  const theme = useTheme()

  return (
    <Box
      backgroundColor="white"
      padding="12px 14px"
      borderRadius={8}
      mt={2}
      border={`1px solid ${theme.colors.borderPrimary}`}
      display="flex"
      flexDirection={icon ? 'row' : 'column'}
      justifyContent={icon ? 'space-between' : 'center'}
      height={height || 70}
      alignItems={icon ? 'center' : 'flex-start'}
      {...styles}
    >
      <Field name={name} validate={validate[name as keyof typeof validate]}>
        {({ field, form, meta }: FieldProps) => (
          <Checkbox
            {...field}
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
            label={label}
            value={value.toString()}
            disabled={disabled}
            onChange={(val) => form.setFieldValue(name, val.target.checked ? value : null)}
            onBlur={field.onBlur}
            checked={form.values[name] === value}
          />
        )}
      </Field>
      {icon && <Tooltips type={id} label={<Box ml={3}>{icon}</Box>} />}
      {sublabel && (
        <Text variant="body2" color="textSecondary" style={{ marginLeft: 26, lineHeight: 'normal' }}>
          {sublabel}
        </Text>
      )}
    </Box>
  )
}

export const PoolStructureSection = () => {
  const theme = useTheme()
  const form = useFormikContext<PoolMetadataInput>()
  const { values } = form

  const subAssetClasses =
    config.assetClasses[form.values.assetClass]?.map((label) => ({
      label,
      value: label,
    })) ?? []

  const getTrancheName = (index: number) => {
    switch (index) {
      case 0:
        return 'Junior'
      case 1:
        return values.trancheStructure === 2 ? 'Senior' : 'Mezzanine'
      case 2:
        return 'Senior'
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
    <Box>
      <Text variant="heading2" fontWeight={700}>
        Pool Structure
      </Text>
      <StyledGrid gridTemplateColumns={['1fr', '1fr', '1fr 1fr']} gap={3} mt={2}>
        <Box>
          <Text variant="body2">Pool type *</Text>
          <CheckboxOption
            height={113}
            name="poolStructure"
            label="Revolving pool"
            value="revolving"
            sublabel="Dynamic and flexible pools that allow continuous inflows and outflows of assets. Investors can add or withdraw funds at any time, and the pool remains active indefinitely."
          />
          <CheckboxOption
            height={113}
            name="poolStructure"
            label="Static pool (coming soon)"
            value="static"
            disabled
            sublabel="Fixed pool of assets where funds remain locked. There are no continuous inflows or outflows during the investment period, and the pool has a defined maturity date."
          />
        </Box>
        <Box>
          <Text variant="body2">Define tranche structure *</Text>
          <CheckboxOption
            name="trancheStructure"
            label="Single tranche"
            id="oneTranche"
            value={1}
            icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
          />
          <CheckboxOption
            name="trancheStructure"
            label="Two tranches"
            id="oneTranche"
            value={2}
            icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
          />
          <CheckboxOption
            name="trancheStructure"
            label="Three tranches"
            id="oneTranche"
            value={3}
            icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
          />
        </Box>
      </StyledGrid>
      <Box mt={4} mb={3}>
        <Text>Asset setup</Text>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Box>
            <Field name="assetClass" validate={validate.assetClass}>
              {({ field, meta, form }: FieldProps) => (
                <Select
                  name="assetClass"
                  label={
                    <Tooltips
                      type="assetClass"
                      label={<Text variant="heading4">Primary asset class*</Text>}
                      size="sm"
                    />
                  }
                  onChange={(event) => {
                    form.setFieldValue('assetClass', event.target.value)
                    form.setFieldValue('subAssetClass', '', false)
                  }}
                  onBlur={field.onBlur}
                  errorMessage={meta.touched && meta.error ? meta.error : undefined}
                  value={field.value}
                  options={ASSET_CLASSES}
                  placeholder="Please select..."
                />
              )}
            </Field>
            <Box mt={3}>
              <Field name="assetDenomination" validate={validate.currency}>
                {({ field, form, meta }: FieldProps) => {
                  return (
                    <Select
                      name="assetDenomination"
                      label={<Tooltips type="currency" label={<Text variant="heading4">Asset denomination*</Text>} />}
                      onChange={(event) => form.setFieldValue('assetDenomination', event.target.value)}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={[
                        { value: 'usdc', label: 'USDC' },
                        { value: 'usdt', label: 'USDT (coming soon)', disabled: true },
                        { value: 'dai', label: 'DAI (coming soon)', disabled: true },
                      ]}
                      placeholder="Select..."
                    />
                  )
                }}
              </Field>
            </Box>
          </Box>
          <Box>
            <Field name="subAssetClass" validate={validate.subAssetClass}>
              {({ field, meta, form }: FieldProps) => (
                <Select
                  name="subAssetClass"
                  label="Secondary asset class"
                  onChange={(event) => form.setFieldValue('subAssetClass', event.target.value)}
                  onBlur={field.onBlur}
                  errorMessage={meta.touched && meta.error ? meta.error : undefined}
                  value={field.value}
                  options={subAssetClasses}
                  placeholder="Select..."
                />
              )}
            </Field>
          </Box>
        </StyledGrid>
      </Box>
      <Box mt={4} mb={3}>
        <Text>Tranches</Text>
        {Array.from({ length: values.trancheStructure }).map((_, index) => (
          <StyledGrid key={index} mt={3}>
            <Text variant="heading3">Tranche {index + 1}</Text>
            <Line />
            <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3}>
              <Box>
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
                <Box mt={3}>
                  <Field name={`tranches.${index}.minInvestment`} validate={validate.minInvestment}>
                    {({ field, form, meta }: FieldProps) => (
                      <CurrencyInput
                        {...field}
                        label={
                          <Tooltips type="minimumInvestment" label={<Text variant="heading4">Min. investment*</Text>} />
                        }
                        placeholder="0.00"
                        currency={values.currency}
                        errorMessage={meta.touched ? meta.error : undefined}
                        onChange={(value) => form.setFieldValue(field.name, value)}
                        onBlur={() => form.setFieldTouched(field.name, true)}
                      />
                    )}
                  </Field>
                </Box>
              </Box>

              <Box>
                <Field name={`tranches.${index}.symbolName`} validate={validate.symbolName}>
                  {({ field, form, meta }: FieldProps) => (
                    <TextInput
                      {...field}
                      onChange={(e) => form.setFieldValue(field.name, e.target.value)}
                      errorMessage={meta.touched ? meta.error : undefined}
                      label={<Tooltips type="tokenSymbol" label={<Text variant="heading4">Token symbol*</Text>} />}
                      placeholder="4-12 characters"
                      minLength={4}
                      maxLength={12}
                    />
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
                          name={`tranches.${index}.interestRate`}
                          validate={validate.interestRate}
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
                      validate={validate.minRiskBuffer}
                    />
                  )}
                </Box>
              </Box>

              {(index === 1 || index === 2) && (
                <>
                  <Box>
                    <Field name={`tranches.${index}.interestRate`} validate={validate.interestRate}>
                      {({ field, form, meta }: FieldProps) => (
                        <CurrencyInput
                          {...field}
                          label={
                            <Tooltips
                              type="fixedTranchInterest"
                              label={<Text variant="heading4">Fixed interest rate</Text>}
                            />
                          }
                          placeholder="0.00"
                          currency={values.currency}
                          errorMessage={meta.touched ? meta.error : undefined}
                          onChange={(value) => form.setFieldValue(field.name, value)}
                          onBlur={() => form.setFieldTouched(field.name, true)}
                        />
                      )}
                    </Field>
                  </Box>
                  <Box width="227px">
                    <Field name={`tranches.${index}.apy`}>
                      {({ field, form }: FieldProps) => (
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
                          value="90 Day"
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
    </Box>
  )
}
