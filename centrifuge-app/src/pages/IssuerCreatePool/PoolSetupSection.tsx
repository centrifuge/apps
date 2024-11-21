import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import {
  Box,
  Button,
  Checkbox,
  FileUpload,
  Grid,
  IconButton,
  IconHelpCircle,
  IconInfo,
  IconTrash,
  NumberInput,
  Select,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../src/components/Tooltips'
import { feeCategories, isTestEnv } from '../../../src/config'
import { AddButton } from './PoolDetailsSection'
import { CheckboxOption, Line, StyledGrid } from './PoolStructureSection'

const MAX_FEES = 5

const FEE_TYPES = [
  { label: 'Direct charge', value: 'chargedUpTo' },
  { label: 'Fixed %', value: 'fixed' },
]

const FEE_POSISTIONS = [{ label: 'Top of waterfall', value: 'Top of waterfall' }]

export const PoolSetupSection = () => {
  const theme = useTheme()
  const form = useFormikContext<PoolMetadataInput>()
  const { values } = form
  const createLabel = (label: string) => `${label}${isTestEnv ? '' : '*'}`

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text variant="heading2" fontWeight={700}>
          Management setup
        </Text>
        <Button small style={{ width: 163 }}>
          Disable
        </Button>
      </Box>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Pool managers*</Text>
        <Text variant="body2" color="textSecondary">
          Pool managers can individually add/block investors and manage the liquidity reserve of the pool.
        </Text>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Box>
            <Text variant="body2">Security requirement</Text>
            <CheckboxOption
              height={44}
              name="securityRequirement"
              label="Single"
              value="single"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
            <CheckboxOption
              height={44}
              name="securityRequirement"
              label="Multi-sig"
              value="multi"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
          </Box>
          <Grid gap={2}>
            <Text variant="body2">Wallet addresses</Text>
            <Field name="walletAddress">
              {({ field, form }: FieldProps) => <TextInput placeholder="Type here..." {...field} />}
            </Field>
            <Field name="walletAddress">
              {({ field, form }: FieldProps) => <TextInput placeholder="Type here..." {...field} />}
            </Field>
          </Grid>
        </StyledGrid>
      </Box>
      <Box mt={2} mb={2}>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Field name="subAssetClass">
            {({ field, meta, form }: FieldProps) => (
              <Select
                name="subAssetClass"
                label="Configuration change threshold (1 out of 2 managers)"
                onChange={(event) => form.setFieldValue('subAssetClass', event.target.value)}
                onBlur={field.onBlur}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                value={field.value}
                options={[{ value: '1', label: 1 }]}
                placeholder="Select..."
              />
            )}
          </Field>
          <Grid display="flex" gap={1}>
            <IconInfo size="iconSmall" color={theme.colors.textSecondary} />
            <Text color="textSecondary" variant="body2">
              For added security, changes to the pool configuration (e.g., tranche structure or write-off policy) may
              require multiple signers and confirmation from the above.
            </Text>
          </Grid>
        </StyledGrid>
      </Box>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Pool delegates</Text>
        <Text variant="body2" color="textSecondary">
          Pool managers can authorize additional addresses to perform designated pool actions.
        </Text>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Grid>
            <Text color="textSecondary" variant="body3">
              Add or remove addresses that can:
            </Text>
            <Field name="walletAddress">
              {({ field, form }: FieldProps) => (
                <TextInput label="Originate assets and invest in the pool*" placeholder="Type address..." {...field} />
              )}
            </Field>
          </Grid>
          <Box display="flex" alignItems="flex-end" justifyContent="flex-end">
            <AddButton />
          </Box>
        </StyledGrid>
      </Box>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Fee setup</Text>
        <StyledGrid mt={3} gap={1}>
          <Text variant="heading3">Protocol fees</Text>
          <Line />
          <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3}>
            <Field
              as={TextInput}
              name={`poolFees.${1}.position`}
              value="Top of waterfall"
              disabled
              label={<Tooltips type="feePosition" label={<Text variant="heading4">Fee position</Text>} />}
            />
            <Field
              as={TextInput}
              name={`poolFees.${1}.type`}
              value="Fixed"
              disabled
              label={<Tooltips type="feeType" label={<Text variant="heading4">Fee type</Text>} />}
            />
            <Field
              as={NumberInput}
              label={<Text variant="heading4">Fees in % of NAV</Text>}
              symbol="%"
              name={`poolFees.${1}.percentOfNav`}
              value="0.4"
              disabled
            />
            <Field
              as={TextInput}
              name={`poolFees.${1}.walletAddress`}
              value="Centrifuge treasury"
              disabled
              label={<Text variant="heading4">Wallet address</Text>}
            />
          </Grid>
        </StyledGrid>
      </Box>

      {values.poolFees.map((s, index) => (
        <Box mt={4} mb={3}>
          <StyledGrid mt={3} gap={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Text variant="heading3">Pool fees {index + 1}</Text>
              <IconButton>
                <IconTrash color="textSecondary" />
              </IconButton>
            </Box>
            <Line />
            <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3}>
              <FieldWithErrorMessage
                as={TextInput}
                label="Name"
                maxLength={30}
                name={`poolFees.${index}.name`}
                key={index}
                placeholder="Type here..."
              />
              <Field name={`poolFees.${index}.category`}>
                {({ field, form, meta }: FieldProps) => (
                  <Select
                    name="category"
                    label="Category"
                    onChange={(event) => form.setFieldValue(`poolFees.${index}.category`, event.target.value)}
                    onBlur={field.onBlur}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    value={field.value}
                    options={feeCategories.map((cat) => ({ label: cat, value: cat }))}
                  />
                )}
              </Field>
              <Field name={`poolFees.${index}.feePosition`}>
                {({ field, meta }: FieldProps) => {
                  return (
                    <Select
                      label="Fee position"
                      name={`poolFees.${index}.feePosition`}
                      onChange={(event) => {
                        form.setFieldValue(`poolFees.${index}.feePosition`, event.target.value)
                      }}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={FEE_POSISTIONS}
                    />
                  )
                }}
              </Field>

              <Field name={`poolFees.${index}.feeType`}>
                {({ field, meta }: FieldProps) => {
                  return (
                    <Select
                      label="Fee type"
                      name={`poolFees.${index}.feeType`}
                      onChange={(event) => {
                        form.setFieldValue(`poolFees.${index}.feeType`, event.target.value)
                      }}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={FEE_TYPES}
                    />
                  )
                }}
              </Field>
              <FieldWithErrorMessage
                as={NumberInput}
                label="Max fees in % of NAV"
                symbol="%"
                name={`poolFees.${index}.percentOfNav`}
                placeholder="Type here..."
              />
              <FieldWithErrorMessage
                as={TextInput}
                label="Wallet address"
                name={`poolFees.${index}.walletAddress`}
                placeholder="Type here..."
              />
            </Grid>
          </StyledGrid>
        </Box>
      ))}

      <Box alignSelf="flex-end" mt={3} mb={3} display="flex" justifyContent="flex-end">
        <AddButton />
      </Box>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Investor onboarding</Text>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Box>
            <Text variant="heading4">Onboarding experience</Text>
            <CheckboxOption
              height={44}
              name="centrifuge"
              label="Centrifuge onboarding"
              value="centrifuge"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
            <CheckboxOption
              height={44}
              name="external"
              label="External"
              value="external"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
            <CheckboxOption
              height={44}
              name="none"
              label="None"
              value="none"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
          </Box>
          <Box>
            <Field name="subscriptionDocuments">
              {({ field, meta, form }: FieldProps) => (
                <FileUpload
                  name="subscriptionDocuments"
                  file={field.value}
                  onFileChange={async (file) => {
                    form.setFieldTouched('poolIcon', true, false)
                    form.setFieldValue('poolIcon', file)
                  }}
                  label="Click to upload"
                  errorMessage={meta.touched && meta.error ? meta.error : undefined}
                  accept="application/pdf"
                  small
                />
              )}
            </Field>
            <Box mt={8}>
              <Text variant="heading4">Tax document requirement</Text>
              <Checkbox label="Require investors to upload tax documents before signing the subscription agreement." />
            </Box>
          </Box>
        </StyledGrid>
      </Box>
    </Box>
  )
}
