import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
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
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../src/components/Tooltips'
import { feeCategories } from '../../../src/config'
import { AddButton } from './PoolDetailsSection'
import { CheckboxOption, Line, StyledGrid } from './PoolStructureSection'

const FEE_TYPES = [
  { label: 'Direct charge', value: 'chargedUpTo' },
  { label: 'Fixed %', value: 'fixed' },
]

const FEE_POSISTIONS = [{ label: 'Top of waterfall', value: 'Top of waterfall' }]

export const PoolSetupSection = () => {
  const theme = useTheme()
  const form = useFormikContext<PoolMetadataInput>()
  const { values } = form

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
              value={false}
              id="singleMultisign"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
            <CheckboxOption
              height={40}
              name="adminMultisigEnabled"
              label="Multi-sig"
              value={true}
              id="multiMultisign"
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
            />
          </Box>
          <Box>
            <Text variant="body2">Wallet addresses</Text>
            <FieldArray name="adminMultisig.signers">
              {({ push }) => (
                <>
                  {values.adminMultisigEnabled ? (
                    values.adminMultisig?.signers?.map((_, index) => (
                      <Box key={index} mt={2}>
                        <Field name={`adminMultisig.signers.${index}`}>
                          {({ field }: FieldProps) => <TextInput placeholder="Type here..." {...field} />}
                        </Field>
                      </Box>
                    ))
                  ) : (
                    <Box mt={2}>
                      <Field name={`adminMultisig.signers.0`}>
                        {({ field }: FieldProps) => <TextInput placeholder="Type here..." {...field} />}
                      </Field>
                    </Box>
                  )}
                  {values.adminMultisigEnabled && (
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                      <AddButton
                        onClick={() => {
                          if (form.values.adminMultisig && form.values.adminMultisig.signers?.length <= 10) {
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
      <Box mt={2} mb={2}>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Field name="subAssetClass">
            {({ field, meta, form }: FieldProps) => (
              <Select
                name="subAssetClass"
                label={`Configuration change threshold (1 out of ${Math.max(
                  values?.adminMultisig?.signers?.length ?? 0,
                  1
                )} managers)`}
                onChange={(event) => form.setFieldValue('subAssetClass', event.target.value)}
                onBlur={field.onBlur}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                value={field.value}
                options={form.values.adminMultisig.signers.map((_: string, i: number) => ({
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

      <Box mt={4} mb={3}>
        <FieldArray name="assetOriginators">
          {({ push }) => (
            <StyledGrid gridTemplateColumns={['3fr 1fr']} gap={2}>
              <Box gridColumn="1 / span 1">
                <Text color="textSecondary" variant="body3">
                  Add or remove addresses that can:
                </Text>
                <Text variant="heading2">Originate assets and invest in the pool*</Text>
                {form.values.assetOriginators?.map((_: string, index: number) => (
                  <Box key={index} mt={2}>
                    <Field name={`assetOriginators.${index}`}>
                      {({ field }: FieldProps) => <TextInput placeholder="Type address..." {...field} />}
                    </Field>
                  </Box>
                ))}
              </Box>

              <Box gridColumn="2 / span 1" alignSelf="end">
                <AddButton
                  onClick={() => {
                    if (form.values.adminMultisig && form.values.adminMultisig.signers?.length <= 10) {
                      push('')
                    }
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

      <FieldArray name="poolFees">
        {({ push, remove }) => (
          <>
            {form.values.poolFees.map((_, index) => (
              <Box mt={4} mb={3} key={index}>
                <StyledGrid mt={3} gap={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Text variant="heading3">Pool fees {index + 1}</Text>
                    {form.values.poolFees.length > 1 && (
                      <IconButton onClick={() => remove(index)}>
                        <IconTrash color="textSecondary" />
                      </IconButton>
                    )}
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
                          onChange={(event) => form.setFieldValue(`poolFees.${index}.feePosition`, event.target.value)}
                          onBlur={field.onBlur}
                          errorMessage={meta.touched && meta.error ? meta.error : undefined}
                          value={field.value}
                          options={FEE_POSISTIONS}
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
            ))}
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
              <FieldArray name="tranches">
                {({ form }) => (
                  <Box>
                    {form.values.tranches.map((tranche, index) => (
                      <Field key={index} name={`subscriptionDocuments[${index}]`}>
                        {({ field, meta }: FieldProps) => (
                          <Box mb={4}>
                            <FileUpload
                              name={`subscriptionDocuments[${index}]`}
                              file={field.value}
                              onFileChange={async (file) => {
                                form.setFieldTouched(`subscriptionDocuments[${index}]`, true, false)
                                form.setFieldValue(`subscriptionDocuments[${index}]`, file)
                              }}
                              label={`Subscription document for ${tranche.trancheName}`}
                              errorMessage={meta.touched && meta.error ? meta.error : undefined}
                              accept="application/pdf"
                              small
                            />
                          </Box>
                        )}
                      </Field>
                    ))}
                  </Box>
                )}
              </FieldArray>
              <Box mt={8}>
                <Text variant="heading4">Tax document requirement</Text>
                <Checkbox
                  label="Require investors to upload tax documents before signing the subscription agreement."
                  variant="square"
                />
              </Box>
            </Box>
          )}
        </StyledGrid>
      </Box>
    </Box>
  )
}
