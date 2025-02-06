import {
  Box,
  CurrencyInput,
  DateInput,
  Grid,
  IconHelpCircle,
  NumberInput,
  Select,
  Tabs,
  TabsItem,
  Text,
} from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useState } from 'react'
import { useTheme } from 'styled-components'
import { Tooltips } from '../../../../src/components/Tooltips'
import { CreateAssetFormValues, PoolWithMetadata } from './CreateAssetsDrawer'
import { maturityOptions } from './LiquidAssetsForm'

const borrowOptions = [
  { label: 'Up to total borrowed', value: 'upToTotalBorrowed' },
  { label: 'Up to outstanding debt', value: 'upToOutstandingDebt' },
]

export const CustomAssetForm = ({ selectedPool }: { selectedPool: PoolWithMetadata }) => {
  const theme = useTheme()
  const form = useFormikContext<CreateAssetFormValues>()
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  return (
    <Box>
      <Tabs selectedIndex={selectedTabIndex} onChange={(index) => setSelectedTabIndex(index)}>
        <TabsItem styleOverrides={{ padding: '8px' }} showBorder>
          <Field name="customType">
            {({ field, form }: FieldProps) => (
              <Box display="flex" alignItems="center" onClick={() => form.setFieldValue('customType', 'atPar')}>
                <Text>At par</Text>
                <Tooltips
                  type="atPar"
                  label={<Box ml={1}>{<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}</Box>}
                />
              </Box>
            )}
          </Field>
        </TabsItem>
        <TabsItem styleOverrides={{ padding: '8px' }} showBorder>
          <Field name="customType">
            {({ field, form }: FieldProps) => (
              <Box
                display="flex"
                alignItems="center"
                onClick={() => form.setFieldValue('customType', 'discountedCashFlow')}
              >
                <Text>Discounted cash flow</Text>
                <Tooltips
                  type="discountedCashFlow"
                  label={<Box ml={1}>{<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}</Box>}
                />
              </Box>
            )}
          </Field>
        </TabsItem>
      </Tabs>
      <Grid
        backgroundColor="backgroundSecondary"
        borderRadius={8}
        p={2}
        border={`1px solid ${theme.colors.borderPrimary}`}
        gap={2}
        mt={2}
      >
        <Field name="borrowRestriction">
          {({ field, form }: FieldProps) => (
            <Select
              name="borrowRestriction"
              label="How much can I borrow?"
              value={field.value}
              options={borrowOptions}
              onChange={(event) => {
                form.setFieldValue('borrowRestriction', event.target.value)
              }}
            />
          )}
        </Field>
        <Field name="collateralValue">
          {({ field, form }: FieldProps) => (
            <CurrencyInput
              name="collateralValue"
              label="Collateral value*"
              value={field.value}
              onChange={(event) => {
                form.setFieldValue('collateralValue', event)
              }}
              placeholder="0.0"
              currency={selectedPool.currency.displayName}
            />
          )}
        </Field>
        <Field name="interestRate">
          {({ field, form }: FieldProps) => (
            <NumberInput
              name="interestRate"
              label={
                <Tooltips type="interestRate" size="med" color={theme.colors.textPrimary} label="Interest rate*" />
              }
              value={field.value}
              onChange={(event) => {
                form.setFieldValue('interestRate', event.target.value)
              }}
              symbol="%"
              placeholder="0.00"
            />
          )}
        </Field>
        <Field name="maturity">
          {({ field, form }: FieldProps) => (
            <Select
              name="maturity"
              label="Maturity"
              value={field.value}
              options={maturityOptions}
              onChange={(event) => {
                form.setFieldValue('maturity', event.target.value)
              }}
            />
          )}
        </Field>
        <Field name="maturityDate">
          {({ field, form }: FieldProps) => (
            <DateInput
              name="maturityDate"
              label="Maturity date*"
              value={field.value}
              onChange={(event) => {
                form.setFieldValue('maturityDate', event.target.value)
              }}
            />
          )}
        </Field>
        <Field name="advanceRate">
          {({ field, form }: FieldProps) => (
            <NumberInput
              name="advanceRate"
              label={<Tooltips type="advanceRate" size="med" color={theme.colors.textPrimary} label="Advance rate*" />}
              value={field.value}
              onChange={(event) => {
                form.setFieldValue('advanceRate', event.target.value)
              }}
              symbol="%"
              placeholder="0.0"
            />
          )}
        </Field>
        {form.values.customType === 'discountedCashFlow' && (
          <>
            <Field name="probabilityOfDefault">
              {({ field, form }: FieldProps) => (
                <NumberInput
                  name="probabilityOfDefault"
                  label={
                    <Tooltips
                      type="probabilityOfDefault"
                      size="med"
                      color={theme.colors.textPrimary}
                      label="Probability of default*"
                    />
                  }
                  value={field.value}
                  onChange={(event) => {
                    form.setFieldValue('probabilityOfDefault', event.target.value)
                  }}
                  symbol="%"
                  placeholder="0.0"
                />
              )}
            </Field>
            <Field name="lossGivenDefault ">
              {({ field, form }: FieldProps) => (
                <NumberInput
                  name="lossGivenDefault"
                  label={
                    <Tooltips
                      type="lossGivenDefault"
                      size="med"
                      color={theme.colors.textPrimary}
                      label="Loss given default*"
                    />
                  }
                  value={field.value}
                  onChange={(event) => {
                    form.setFieldValue('lossGivenDefault', event.target.value)
                  }}
                  symbol="%"
                  placeholder="0.0"
                />
              )}
            </Field>
            <Field name="discountRate">
              {({ field, form }: FieldProps) => (
                <NumberInput
                  name="discountRate"
                  label={
                    <Tooltips type="discountRate" size="med" color={theme.colors.textPrimary} label="Discount rate*" />
                  }
                  value={field.value}
                  onChange={(event) => {
                    form.setFieldValue('discountRate', event.target.value)
                  }}
                  symbol="%"
                  placeholder="0.0"
                />
              )}
            </Field>
          </>
        )}
      </Grid>
    </Box>
  )
}
