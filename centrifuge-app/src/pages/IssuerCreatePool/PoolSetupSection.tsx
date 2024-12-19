import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { useCentEvmChainId, useWallet } from '@centrifuge/centrifuge-react'
import {
  Box,
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
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { useEffect } from 'react'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../src/components/Tooltips'
import { feeCategories } from '../../../src/config'
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
            label="Require investors to upload tax documents before signing the subscription agreement."
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
  const { selectedAccount } = useWallet().substrate

  useEffect(() => {
    form.setFieldValue('adminMultisig.signers[0]', selectedAccount?.address)
  }, [])
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
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Box>
            <Text variant="body2">Security requirement</Text>
            <CheckboxOption
              height={40}
              name="adminMultisigEnabled"
              label="Single"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
              onChange={() => {
                form.setFieldValue('adminMultisigEnabled', false)
              }}
              isChecked={!values.adminMultisigEnabled}
              id="singleMultisign"
            />
            <CheckboxOption
              height={40}
              name="adminMultisigEnabled"
              label="Multi-sig"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
              onChange={() => {
                form.setFieldValue('adminMultisigEnabled', true)
                form.setFieldValue('adminMultisig.signers', [form.values.adminMultisig.signers[0], ''])
              }}
              isChecked={values.adminMultisigEnabled}
              id="multiMultisign"
            />
          </Box>
          <Box>
            <Text variant="body2">Wallet addresses</Text>
            <FieldArray name="adminMultisig.signers">
              {({ push, remove }) => (
                <>
                  {values.adminMultisigEnabled ? (
                    values.adminMultisig?.signers?.map((_, index) => (
                      <Box key={index} mt={2}>
                        <Field name={`adminMultisig.signers.${index}`} validate={validate.addressValidate}>
                          {() => (
                            <Grid gridTemplateColumns={['1fr 24px']} alignItems="center">
                              <FormAddressInput
                                name={`adminMultisig.signers.${index}`}
                                placeholder="Type address..."
                                chainId={chainId}
                              />
                              {values.adminMultisig.signers.length >= 3 && index >= 2 && (
                                <IconButton onClick={() => remove(index)}>
                                  <IconTrash color="textSecondary" />
                                </IconButton>
                              )}
                            </Grid>
                          )}
                        </Field>
                      </Box>
                    ))
                  ) : (
                    <Box mt={2}>
                      <Field name={`adminMultisig.signers.0`} validate={validate.addressValidate}>
                        {({ field }: FieldProps) => (
                          <FieldWithErrorMessage
                            {...field}
                            as={TextInput}
                            placeholder="Type address..."
                            onBlur={field.onBlur}
                          />
                        )}
                      </Field>
                    </Box>
                  )}
                  {values.adminMultisigEnabled && (
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                      <AddButton
                        onClick={() => {
                          if (values.adminMultisig && values.adminMultisig.signers?.length <= 10) {
                            push('')
                          }
                        }}
                      />
                    </Box>
                  )}
                </>
              )}
            </FieldArray>
          </Box>
        </StyledGrid>
      </Box>
      {values.adminMultisigEnabled && (
        <Box mt={2} mb={2}>
          <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
            <Field name="adminMultisig.threshold">
              {({ field, meta, form }: FieldProps) => (
                <Select
                  name="adminMultisig.threshold"
                  label={`Configuration change threshold (${values?.adminMultisig?.threshold} out of ${Math.max(
                    values?.adminMultisig?.signers?.length ?? 0,
                    1
                  )} managers)`}
                  onChange={(event) => form.setFieldValue('adminMultisig.threshold', event.target.value)}
                  onBlur={field.onBlur}
                  errorMessage={meta.touched && meta.error ? meta.error : undefined}
                  value={field.value}
                  options={values.adminMultisig?.signers.map((_: string | number, i: any) => ({
                    label: i + 1,
                    value: i + 1,
                  }))}
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
      )}

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
                          placeholder="Type address..."
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
              if (index === 0) return
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
                            options={feeCategories.map((cat) => ({ label: cat, value: cat }))}
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
