import { PoolMetadata, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  FileUpload,
  IconMinusCircle,
  SearchInput,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { lastValueFrom } from 'rxjs'
import styled from 'styled-components'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { PageSection } from '../../../components/PageSection'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { KYB_COUNTRY_CODES, KYC_COUNTRY_CODES, RESTRICTED_COUNTRY_CODES } from '../../Onboarding/geographyCodes'

type OnboardingSettingsInput = {
  agreements: { [trancheId: string]: File | string | undefined }
  kybRestrictedCountries: string[]
  kycRestrictedCountries: string[]
  externalOnboardingUrl?: string
}

export const OnboardingSettings = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool) as { data: PoolMetadata }
  const [isEditing, setIsEditing] = React.useState(false)
  const [useExternalUrl, setUseExternalUrl] = React.useState(!!poolMetadata?.onboarding?.externalOnboardingUrl)
  const centrifuge = useCentrifuge()

  const { execute: updateConfigTx, isLoading } = useCentrifugeTransaction(
    'Update pool config',
    (cent) => cent.pools.setMetadata,
    {
      onSuccess: () => {
        setIsEditing(false)
      },
    }
  )

  const initialValues: OnboardingSettingsInput = React.useMemo(() => {
    return {
      agreements: (pool.tranches as Token[]).reduce<OnboardingSettingsInput['agreements']>(
        (prevT, currT) => ({
          ...prevT,
          [currT.id]: poolMetadata?.onboarding?.agreements?.[currT.id]?.uri
            ? centrifuge.metadata.parseMetadataUrl(poolMetadata?.onboarding?.agreements[currT.id].uri)
            : undefined,
        }),
        {}
      ),
      kybRestrictedCountries:
        poolMetadata?.onboarding?.kybRestrictedCountries?.map(
          (c) => KYB_COUNTRY_CODES[c as keyof typeof KYB_COUNTRY_CODES]
        ) ?? [],
      kycRestrictedCountries:
        poolMetadata?.onboarding?.kycRestrictedCountries?.map(
          (c) => KYC_COUNTRY_CODES[c as keyof typeof KYC_COUNTRY_CODES]
        ) ?? [],
      externalOnboardingUrl: poolMetadata?.onboarding?.externalOnboardingUrl ?? '',
    }
  }, [pool, poolMetadata])

  React.useEffect(() => {
    if (isEditing) return
    formik.resetForm()
    formik.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  const formik = useFormik({
    initialValues,
    validateOnBlur: true,
    validateOnChange: false,
    validate(values) {
      const errors: Partial<OnboardingSettingsInput> = {}
      if (useExternalUrl && !values.externalOnboardingUrl) {
        errors.externalOnboardingUrl = 'Link required for external onboarding'
      }
      if (useExternalUrl && values.externalOnboardingUrl) {
        if (!values.externalOnboardingUrl.includes('http') || !new URL(values.externalOnboardingUrl)) {
          errors.externalOnboardingUrl = 'Invalid URL'
        }
      }
      return errors
    },
    onSubmit: async (values, actions) => {
      if (!values.agreements || !poolMetadata) {
        return
      }
      let onboardingAgreements = poolMetadata?.onboarding?.agreements ?? {}
      for (const [tId, file] of Object.entries(values.agreements)) {
        if (!file) {
          continue
        }
        // file is already IPFS hash so it hasn't changed
        if (typeof file === 'string') {
          onboardingAgreements = {
            ...onboardingAgreements,
            [tId]: { uri: file, mime: 'application/pdf' },
          }
        } else {
          const uri = await getFileDataURI(file)
          const pinnedAgreement = await lastValueFrom(centrifuge.metadata.pinFile(uri))
          onboardingAgreements = {
            ...onboardingAgreements,
            [tId]: { uri: centrifuge.metadata.parseMetadataUrl(pinnedAgreement.ipfsHash), mime: file.type },
          }
        }
      }

      const kybRestrictedCountries = values.kybRestrictedCountries
        .map((country) => Object.entries(KYB_COUNTRY_CODES).find(([_c, _country]) => _country === country)?.[0] ?? '')
        .filter(Boolean)

      const kycRestrictedCountries = values.kycRestrictedCountries
        .map((country) => Object.entries(KYC_COUNTRY_CODES).find(([_c, _country]) => _country === country)?.[0] ?? '')
        .filter(Boolean)

      const amendedMetadata: PoolMetadata = {
        ...poolMetadata,
        onboarding: {
          agreements: onboardingAgreements,
          kycRestrictedCountries,
          kybRestrictedCountries,
          externalOnboardingUrl: useExternalUrl ? values.externalOnboardingUrl : undefined,
        },
      }
      updateConfigTx([poolId, amendedMetadata])
      actions.setSubmitting(true)
    },
  })

  return (
    <FormikProvider value={formik}>
      <Form>
        <PageSection
          title="Onboarding settings"
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  small
                  loading={formik.isSubmitting || isLoading}
                  loadingMessage={formik.isSubmitting || isLoading ? 'Pending...' : undefined}
                  key="done"
                  disabled={formik.isSubmitting || isLoading}
                >
                  Done
                </Button>
              </ButtonGroup>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} small key="edit">
                Edit
              </Button>
            )
          }
        >
          <Stack gap={3} mb={5}>
            <Stack gap={2}>
              <Text variant="heading4">Onboarding provider</Text>
              <Shelf as="nav" bg="backgroundSecondary" borderRadius="20px" p="5px" width="fit-content">
                <ToggleButton
                  forwardedAs="button"
                  variant="interactive2"
                  isActive={!useExternalUrl}
                  disabled={!isEditing || formik.isSubmitting || isLoading}
                  type="button"
                  onClick={() => setUseExternalUrl(false)}
                >
                  Centrifuge
                </ToggleButton>
                <ToggleButton
                  forwardedAs="button"
                  variant="interactive2"
                  type="button"
                  isActive={useExternalUrl}
                  disabled={!isEditing || formik.isSubmitting || isLoading}
                  onClick={() => setUseExternalUrl(true)}
                >
                  External
                </ToggleButton>
              </Shelf>
              {useExternalUrl && (
                <TextInput
                  value={formik.values.externalOnboardingUrl}
                  onChange={(e) => formik.setFieldValue('externalOnboardingUrl', e.target.value)}
                  placeholder="https://"
                  label="External onboarding url"
                  onBlur={formik.handleBlur}
                  disabled={!isEditing || formik.isSubmitting || isLoading}
                  errorMessage={
                    formik.errors.externalOnboardingUrl && useExternalUrl
                      ? formik.errors.externalOnboardingUrl
                      : undefined
                  }
                />
              )}
            </Stack>
            <Stack gap={2}>
              <Text variant="heading4">Subscription documents</Text>
              {Object.entries(formik.values.agreements).map(([tId, agreement]) => {
                return (
                  <Box key={tId}>
                    <FileUpload
                      label={`Subscription document for ${
                        (pool.tranches as Token[])?.find((t) => t.id === tId)?.currency.name
                      }`}
                      onFileChange={(file) => {
                        formik.setFieldValue('agreements', {
                          ...formik.values.agreements,
                          [tId]: file,
                        })
                      }}
                      placeholder="Choose a file..."
                      disabled={!isEditing || formik.isSubmitting || isLoading}
                      file={agreement}
                      accept="application/pdf"
                    />
                  </Box>
                )
              })}
            </Stack>
            <Stack gap={2}>
              <Text variant="heading4">Restricted onboarding countries (KYB)</Text>
              <DefaultRestrictedCountries />
              <SearchInput
                label="Add restricted KYB onboarding countries"
                placeholder="Search country to add"
                disabled={!isEditing || formik.isSubmitting || isLoading}
                onChange={(e) => {
                  if (
                    Object.values(KYB_COUNTRY_CODES).includes(e.target.value as keyof typeof KYB_COUNTRY_CODES) &&
                    !formik.values.kybRestrictedCountries.includes(e.target.value)
                  ) {
                    formik.setFieldValue('kybRestrictedCountries', [
                      ...formik.values.kybRestrictedCountries,
                      e.target.value,
                    ])
                  }
                }}
                list="kybSupportedCountries"
              />
              <datalist id="kybSupportedCountries">
                {Object.entries(KYB_COUNTRY_CODES)
                  .filter(([_, country]) => !formik.values.kybRestrictedCountries.includes(country))
                  .map(([code, country]) => (
                    <option key={code} value={country} id={code} />
                  ))}
              </datalist>
              <Stack gap={0}>
                {formik.values.kybRestrictedCountries.length > 0 && (
                  <Text color="textSecondary" variant="body2">
                    KYB restricted countries
                  </Text>
                )}
                {formik.values.kybRestrictedCountries.map((country) => (
                  <Shelf
                    p="4px"
                    width="100%"
                    justifyContent="space-between"
                    borderBottom="1px solid"
                    borderBottomColor="borderSecondary"
                  >
                    <Text
                      key={country}
                      variant="body2"
                      color={isEditing && !isLoading && !formik.isSubmitting ? 'textPrimary' : 'textDisabled'}
                    >
                      {country}
                    </Text>
                    <Button
                      disabled={!isEditing || formik.isSubmitting || isLoading}
                      variant="tertiary"
                      icon={IconMinusCircle}
                      onClick={() => {
                        formik.setFieldValue(
                          'kybRestrictedCountries',
                          formik.values.kybRestrictedCountries.filter((c) => c !== country)
                        )
                      }}
                    />
                  </Shelf>
                ))}
              </Stack>
              <Text variant="heading4">Restricted onboarding countries (KYC)</Text>
              <DefaultRestrictedCountries />
              <SearchInput
                label="Add restricted KYC onboarding countries"
                placeholder="Search country to add"
                disabled={!isEditing || formik.isSubmitting || isLoading}
                onChange={(e) => {
                  if (
                    Object.values(KYC_COUNTRY_CODES).includes(e.target.value as keyof typeof KYC_COUNTRY_CODES) &&
                    !formik.values.kycRestrictedCountries.includes(e.target.value)
                  ) {
                    formik.setFieldValue('kycRestrictedCountries', [
                      ...formik.values.kycRestrictedCountries,
                      e.target.value,
                    ])
                  }
                }}
                list="kycSupportedCountries"
              />
              <datalist id="kycSupportedCountries">
                {Object.entries(KYC_COUNTRY_CODES)
                  .filter(([_, country]) => !formik.values.kycRestrictedCountries.includes(country))
                  .map(([code, country]) => (
                    <option key={code} value={country} id={code} />
                  ))}
              </datalist>
              <Stack gap={0}>
                {formik.values.kycRestrictedCountries.length > 0 && (
                  <Text color="textSecondary" variant="body2">
                    KYC restricted countries
                  </Text>
                )}
                {formik.values.kycRestrictedCountries.map((country) => (
                  <Shelf
                    p="4px"
                    width="100%"
                    justifyContent="space-between"
                    borderBottom="1px solid"
                    borderBottomColor="borderSecondary"
                  >
                    <Text
                      key={country}
                      variant="body2"
                      color={isEditing && !isLoading && !formik.isSubmitting ? 'textPrimary' : 'textDisabled'}
                    >
                      {country}
                    </Text>
                    <Button
                      disabled={!isEditing || formik.isSubmitting || isLoading}
                      variant="tertiary"
                      icon={IconMinusCircle}
                      onClick={() => {
                        formik.setFieldValue(
                          'kycRestrictedCountries',
                          formik.values.kycRestrictedCountries.filter((c) => c !== country)
                        )
                      }}
                    />
                  </Shelf>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}

const DefaultRestrictedCountries = () => {
  return (
    <details>
      <summary>
        <Text style={{ display: 'inline' }} variant="body2">
          Unsupported countries
        </Text>
      </summary>
      <Stack as="ul" gap={0} style={{ listStyle: 'disc', listStylePosition: 'inside' }}>
        {Object.values(RESTRICTED_COUNTRY_CODES).map((country) => (
          <Text key={country} as="li" variant="body2">
            {country}
          </Text>
        ))}
      </Stack>
    </details>
  )
}

const ToggleButton = styled(Text)<{ isActive: boolean }>`
  appearance: none;
  border: 0;
  cursor: pointer;
  display: block;
  padding: 8px 16px;
  border-radius: 20px;

  color: ${({ theme, isActive }) => (isActive ? theme.colors.textInteractive : theme.colors.textPrimary)};
  box-shadow: ${({ theme, isActive }) => (isActive ? theme.shadows.cardInteractive : 'none')};
  background: ${({ theme, isActive }) => (isActive ? theme.colors.backgroundPage : 'transparent')};

  ${({ disabled, theme }) =>
    disabled &&
    `
    cursor: not-allowed;
    color: ${theme.colors.textDisabled};
  `}
`
