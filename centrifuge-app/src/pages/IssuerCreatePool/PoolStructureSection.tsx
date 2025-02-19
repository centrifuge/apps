import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { Box, Grid, IconHelpCircle, RadioButton, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { Tooltips, tooltipText } from '../../../src/components/Tooltips'
import { config } from '../../config'
import { TranchesSection } from './TranchesSection'
import { createEmptyTranche } from './types'
import { validate } from './validate'

export const StyledGrid = styled(Grid)`
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border: ${({ theme }) => `1px solid ${theme.colors.borderPrimary}`};
  border-radius: 8px;
  gap: 24px;
  @media (max-width: ${({ theme }) => theme.breakpoints.S}) {
    padding: 12px;
  }
`

const tranches: { [key: number]: { label: string; id: string; length: number } } = {
  0: { label: 'Single tranche', id: 'oneTranche', length: 1 },
  1: { label: 'Two tranches', id: 'twoTranches', length: 2 },
  2: { label: 'Three tranches', id: 'threeTranches', length: 3 },
}

export const Line = () => {
  const theme = useTheme()
  return <Box border={`.5px solid ${theme.colors.borderPrimary}`} width="100%" />
}

export const ASSET_CLASSES = Object.keys(config.assetClasses).map((key) => ({
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
  onChange,
  isChecked,
}: {
  name: string
  label: string
  sublabel?: string
  value?: string | number | boolean
  disabled?: boolean
  icon?: React.ReactNode
  id?: keyof typeof tooltipText
  height?: number
  styles?: React.CSSProperties
  onChange?: () => void
  isChecked?: boolean
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
      {onChange ? (
        <RadioButton label={label} disabled={disabled} onChange={onChange} checked={isChecked} />
      ) : (
        <Field name={name} validate={validate[name as keyof typeof validate]}>
          {({ field, form, meta }: FieldProps) => (
            <RadioButton
              {...field}
              errorMessage={meta.touched && meta.error ? meta.error : undefined}
              label={label}
              value={value?.toString() || ''}
              disabled={disabled}
              onChange={(val) => form.setFieldValue(name, val.target.checked ? value : null)}
              onBlur={field.onBlur}
              checked={form.values[name] === value}
            />
          )}
        </Field>
      )}
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

  const handleTrancheCheckboxChange = (selectedValue: number) => {
    if (selectedValue === 0) {
      // Set to single tranche: Junior
      form.setFieldValue('tranches', [createEmptyTranche('Junior')])
    } else if (selectedValue === 1) {
      // Set to two tranches: Junior, Senior
      form.setFieldValue('tranches', [createEmptyTranche('Junior'), createEmptyTranche('Senior')])
    } else if (selectedValue === 2) {
      // Set to three tranches: Junior, Mezzanine, Senior
      form.setFieldValue('tranches', [
        createEmptyTranche('Junior'),
        createEmptyTranche('Mezzanine'),
        createEmptyTranche('Senior'),
      ])
    }
  }

  return (
    <Box>
      <Text variant="heading2" fontWeight={700}>
        Pool Structure
      </Text>
      <StyledGrid gridTemplateColumns={['1fr', '1fr', '1fr 1fr']} gap={3} mt={2} p={5}>
        <Box>
          <Text variant="heading4">Pool structure*</Text>
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
          <Box mt={2}>
            <FieldWithErrorMessage
              name="poolName"
              as={TextInput}
              label="Pool name*"
              placeholder="Type here..."
              maxLength={100}
              validate={validate.poolName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue('poolName', e.target.value)}
            />
          </Box>
        </Box>
        <Box>
          <Text variant="heading4">Define tranche structure *</Text>

          {Array.from({ length: 3 }).map((_, index) => {
            return (
              <CheckboxOption
                name="tranches"
                label={tranches[index].label}
                id={tranches[index].id}
                icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
                onChange={() => handleTrancheCheckboxChange(index)}
                isChecked={values.tranches.length === tranches[index].length}
              />
            )
          })}
        </Box>
      </StyledGrid>
      <Box mt={4} mb={3}>
        <Text>Asset setup</Text>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3} p={5}>
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
                  label="Secondary asset class*"
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
      <TranchesSection />
    </Box>
  )
}
