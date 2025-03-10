import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { useCentEvmChainId, useWallet } from '@centrifuge/centrifuge-react'
import {
  Box,
  Checkbox,
  FileUpload,
  Grid,
  IconButton,
  IconHelpCircle,
  IconTrash,
  NumberInput,
  Select,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { useEffect } from 'react'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../src/components/Tooltips'
import { feeCategories } from '../../../src/config'
import { MultisigForm } from '../../components/MultisigForm'
import { FormAddressInput } from './FormAddressInput'
import { AddButton } from './PoolDetailsSection'
import { CheckboxOption, Line, StyledGrid } from './PoolStructureSection'
import { CreatePoolValues } from './types'
import { validate } from './validate'

const FEE_TYPES = [
  { label: 'Please select...', value: '' },
  { label: 'Direct charge', value: 'chargedUpTo' },
  { label: 'Fixed %', value: 'fixed' },
]

const FEE_POSISTIONS = [
  { label: 'Please select...', value: '' },
  { label: 'Top of waterfall', value: 'Top of waterfall' },
]

const TaxDocument = () => {
  const form = useFormikContext<PoolMetadataInput>()
  return (
    <Box mt={3}>
      <Text variant="heading4" style={{ marginBottom: 4 }}>
        Tax document requirement
      </Text>
      <Field name="onboarding">
        {({ field }: FieldProps) => (
          <Checkbox
            {...field}
            label={
              <Text variant="body2">
                Require investors to upload tax documents before signing the subscription agreement.
              </Text>
            }
            onChange={(val) => form.setFieldValue('onboarding.taxInfoRequired', val.target.checked ? true : false)}
          />
        )}
      </Field>
    </Box>
  )
}

export const PoolSetupSection = () => {
  const theme = useTheme()
  const chainId = useCentEvmChainId()
  const form = useFormikContext<CreatePoolValues>()
  const { values } = form
  const ctx = useWallet()
  const { substrate } = ctx

  useEffect(() => {
    form.setFieldValue('adminMultisig.signers[0]', substrate.selectedAddress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [substrate.selectedAddress])

  return (
    <Box>
      <Text variant="heading2" fontWeight={700}>
        Management setup
      </Text>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Pool managers*</Text>
        <Text variant="body2" color="textSecondary">
          Pool managers can individually add/block investors and manage the liquidity reserve of the pool.
        </Text>
        <Box mt={3}>
          <MultisigForm canEditFirst={false} cardProps={{ p: ['12px', 5] }} />
        </Box>
      </Box>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Pool delegates</Text>
        <Text variant="body2" color="textSecondary">
          Pool managers can authorize additional addresses to perform designated pool actions.
        </Text>
        <FieldArray name="assetOriginators">
          {({ push }) => (
            <StyledGrid gridTemplateColumns={['3fr 1fr']} gap={2} mt={3}>
              <Box gridColumn="1 / span 1">
                <Text color="textSecondary" variant="body3">
                  Add or remove addresses that can:
                </Text>
                <Text variant="heading2">Originate assets and invest in the pool</Text>
                {values.assetOriginators?.map((_: string, index: number) => (
                  <Box key={index} mt={2}>
                    <Field name={`assetOriginators.${index}`}>
                      {() => (
                        <FormAddressInput
                          name={`assetOriginators.${index}`}
                          placeholder="Enter address..."
                          chainId={chainId}
                        />
                      )}
                    </Field>
                  </Box>
                ))}
              </Box>
              <Box gridColumn="2 / span 1" mt="54px">
                <AddButton
                  onClick={() => {
                    push('')
                  }}
                />
              </Box>
            </StyledGrid>
          )}
        </FieldArray>
      </Box>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Fee setup</Text>
        <StyledGrid mt={3} gap={1}>
          <Text variant="heading3">Protocol fees</Text>
          <Line />
          <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3}>
            <Field
              as={TextInput}
              name={`poolFees.${0}.position`}
              value={values.poolFees[0].feePosition}
              disabled
              label={<Tooltips type="feePosition" label={<Text variant="heading4">Fee position</Text>} />}
            />
            <Field
              as={TextInput}
              name={`poolFees.${0}.feeType`}
              value={values.poolFees[0].feeType}
              disabled
              label={<Tooltips type="feeType" label={<Text variant="heading4">Fee type</Text>} />}
            />
            <Field
              as={NumberInput}
              label={<Text variant="heading4">Fees in % of NAV</Text>}
              symbol="%"
              name={`poolFees.${1}.percentOfNav`}
              value={values.poolFees[0].percentOfNav}
              disabled
            />
            <Field
              as={TextInput}
              name={`poolFees.${1}.walletAddress`}
              value={values.poolFees[0].walletAddress}
              disabled
              label={<Text variant="heading4">Wallet address</Text>}
            />
          </Grid>
        </StyledGrid>
      </Box>

      {/* POOL FEES  */}
      <FieldArray name="poolFees">
        {({ push, remove }) => (
          <>
            {values.poolFees.map((_, index) => {
              if (index === 0) return null
              return (
                <Box mt={4} mb={3} key={index}>
                  <StyledGrid mt={3} gap={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Text variant="heading3">Pool fees {index + 1}</Text>
                      <IconButton onClick={() => remove(index)}>
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
                        placeholder="Type here..."
                      />
                      <Field name={`poolFees.${index}.category`}>
                        {({ field, meta }: FieldProps) => (
                          <Select
                            name="category"
                            label="Category"
                            onChange={(event) => form.setFieldValue(`poolFees.${index}.category`, event.target.value)}
                            onBlur={field.onBlur}
                            errorMessage={meta.touched && meta.error ? meta.error : undefined}
                            value={field.value}
                            options={[
                              { label: 'Please select', value: '' },
                              ...feeCategories.map((cat) => ({ label: cat, value: cat })),
                            ]}
                          />
                        )}
                      </Field>
                      <Field name={`poolFees.${index}.feePosition`}>
                        {({ field, meta }: FieldProps) => (
                          <Select
                            label="Fee position"
                            name={`poolFees.${index}.feePosition`}
                            onChange={(event) =>
                              form.setFieldValue(`poolFees.${index}.feePosition`, event.target.value)
                            }
                            onBlur={field.onBlur}
                            errorMessage={meta.touched && meta.error ? meta.error : undefined}
                            value={field.value}
                            options={FEE_POSISTIONS}
                            placeholder="Please select"
                          />
                        )}
                      </Field>
                      <Field name={`poolFees.${index}.feeType`}>
                        {({ field, meta }: FieldProps) => (
                          <Select
                            label="Fee type"
                            name={`poolFees.${index}.feeType`}
                            onChange={(event) => form.setFieldValue(`poolFees.${index}.feeType`, event.target.value)}
                            onBlur={field.onBlur}
                            errorMessage={meta.touched && meta.error ? meta.error : undefined}
                            value={field.value}
                            options={FEE_TYPES}
                            placeholder="Please select"
                          />
                        )}
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
              )
            })}
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <AddButton
                onClick={() =>
                  push({ name: '', category: '', feePosition: '', feeType: '', percentOfNav: '', walletAddress: '' })
                }
              />
            </Box>
          </>
        )}
      </FieldArray>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Investor onboarding</Text>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Box>
            <Text variant="heading4">Onboarding experience</Text>
            <CheckboxOption
              height={44}
              name="onboardingExperience"
              label="Centrifuge onboarding"
              value="centrifuge"
              id="centrifugeOnboarding"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
              styles={{ marginTop: 1 }}
            />
            <CheckboxOption
              height={44}
              name="onboardingExperience"
              label="External"
              value="external"
              id="externalOnboarding"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
            <CheckboxOption
              height={44}
              name="onboardingExperience"
              label="None"
              value="none"
              id="noneOnboarding"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
          </Box>
          {values.onboardingExperience === 'centrifuge' && (
            <Box>
              {values.tranches.map((tranche, index) => (
                <Field
                  key={index}
                  name={`onboarding.tranches.${tranche.tokenName}`}
                  validate={validate.executiveSummary}
                >
                  {({ field, meta }: FieldProps) => (
                    <Box mb={4}>
                      <FileUpload
                        name={`onboarding.tranches.${tranche.tokenName}`}
                        file={field.value}
                        onFileChange={async (file) => {
                          form.setFieldTouched(`onboarding.tranches.${tranche.tokenName}`, true, false)
                          form.setFieldValue(`onboarding.tranches.${tranche.tokenName}`, file)
                        }}
                        label={`Subscription document for ${tranche.tokenName}`}
                        errorMessage={meta.touched && meta.error ? meta.error : undefined}
                        accept="application/pdf"
                        small
                      />
                    </Box>
                  )}
                </Field>
              ))}
              <TaxDocument />
            </Box>
          )}
          {values.onboardingExperience === 'external' && (
            <Box>
              <Field name="onboarding.externalOnboardingUrl" validate={validate.externalOnboardingUrl}>
                {({ field, meta }: FieldProps) => (
                  <FieldWithErrorMessage
                    {...field}
                    onBlur={field.onBlur}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    as={TextInput}
                    label="External onboarding url"
                  />
                )}
              </Field>
              <TaxDocument />
            </Box>
          )}
        </StyledGrid>
      </Box>
    </Box>
  )
}
