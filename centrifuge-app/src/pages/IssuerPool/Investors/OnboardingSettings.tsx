import { Account, addressToHex, PoolMetadata, PoolRoleInput, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Checkbox,
  FileUpload,
  IconMinusCircle,
  RadioButton,
  SearchInput,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { FieldArray, Form, FormikProps, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { combineLatest, lastValueFrom, switchMap, takeWhile } from 'rxjs'
import styled from 'styled-components'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { usePoolPermissions, useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { KYB_COUNTRY_CODES, KYC_COUNTRY_CODES, RESTRICTED_COUNTRY_CODES } from '../../Onboarding/geographyCodes'

type Row = {
  country: string
  index: number
}

type OnboardingSettingsInput = {
  agreements: { [trancheId: string]: File | string | undefined }
  kybRestrictedCountries: string[]
  kycRestrictedCountries: string[]
  externalOnboardingUrl?: string
  openForOnboarding: { [trancheId: string]: boolean }
  podReadAccess: boolean
  taxInfoRequired: boolean
}

export const OnboardingSettings = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool) as { data: PoolMetadata }
  const [isEditing, setIsEditing] = React.useState(false)
  const [useExternalUrl, setUseExternalUrl] = React.useState(!!poolMetadata?.onboarding?.externalOnboardingUrl)
  const centrifuge = useCentrifuge()
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })
  const permissions = usePoolPermissions(poolId)

  const { execute: updatePermissionAndConfigTx, isLoading: isPermissionsLoading } = useCentrifugeTransaction(
    'Update permissions and metadata',
    (cent) =>
      (
        args: [add: [Account, PoolRoleInput][], remove: [Account, PoolRoleInput][], metadata: PoolMetadata],
        options
      ) => {
        const [add, remove, metadata] = args

        return combineLatest([
          cent.getApi(),
          cent.pools.setMetadata([poolId, metadata as any], { batch: true }),
          cent.pools.updatePoolRoles([poolId, add, remove], { batch: true }),
        ]).pipe(
          switchMap(([api, metadataTx, permissionTx]) => {
            const tx = api.tx.utility.batchAll([metadataTx, ...permissionTx.method.args[0]])
            return cent.wrapSignAndSend(api, tx, options).pipe(
              takeWhile(({ status }) => {
                return !status.InBlock
              })
            )
          })
        )
      },
    {
      onSuccess: () => {
        setIsEditing(false)
      },
      onError(error) {
        console.error(error)
      },
    }
  )

  const { execute: updateConfigTx, isLoading: isMetadataLoading } = useCentrifugeTransaction(
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
          [currT.id]: poolMetadata?.onboarding?.tranches?.[currT.id]?.agreement?.uri
            ? centrifuge.metadata.parseMetadataUrl(poolMetadata.onboarding.tranches[currT.id].agreement!.uri)
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
      openForOnboarding: (pool.tranches as Token[]).reduce<OnboardingSettingsInput['openForOnboarding']>(
        (prevT, currT) => ({
          ...prevT,
          [currT.id]: !!poolMetadata?.onboarding?.tranches?.[currT.id]?.openForOnboarding,
        }),
        {}
      ),
      podReadAccess: !!poolMetadata?.onboarding?.podReadAccess || false,
      taxInfoRequired: !!poolMetadata?.onboarding?.taxInfoRequired || true,
    }
  }, [pool, poolMetadata, centrifuge.metadata])

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
      if (!values || !poolMetadata) {
        return
      }
      let onboardingTranches = {}
      for (const [tId, file] of Object.entries(values.agreements)) {
        const openForOnboarding = !!values.openForOnboarding[tId]
        if (!file) {
          onboardingTranches = {
            ...onboardingTranches,
            [tId]: {
              agreement: undefined,
              openForOnboarding,
            },
          }
        }
        // file is already IPFS hash so it hasn't changed
        else if (typeof file === 'string') {
          onboardingTranches = {
            ...onboardingTranches,
            [tId]: {
              agreement: { uri: file, mime: 'application/pdf' },
              openForOnboarding,
            },
          }
        } else {
          const uri = await getFileDataURI(file)
          const pinnedAgreement = await lastValueFrom(centrifuge.metadata.pinFile(uri))
          onboardingTranches = {
            ...onboardingTranches,
            [tId]: {
              agreement: { uri: centrifuge.metadata.parseMetadataUrl(pinnedAgreement.ipfsHash), mime: file.type },
              openForOnboarding,
            },
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
          tranches: onboardingTranches,
          kycRestrictedCountries,
          kybRestrictedCountries,
          externalOnboardingUrl: useExternalUrl ? values.externalOnboardingUrl : undefined,
          podReadAccess: values.podReadAccess,
          taxInfoRequired: values.taxInfoRequired,
        },
      }

      const investorAdmin = import.meta.env.REACT_APP_MEMBERLIST_ADMIN_PURE_PROXY
      const hasMemberlistPermissions = permissions?.[addressToHex(investorAdmin)]?.roles.includes('InvestorAdmin')
      const isAnyTrancheOpen = Object.values(values.openForOnboarding).includes(true)
      if (!useExternalUrl && isAnyTrancheOpen && !hasMemberlistPermissions) {
        // pool is open for onboarding and onboarding-api proxy is not in pool permissions
        updatePermissionAndConfigTx([[[investorAdmin, 'InvestorAdmin']], [], amendedMetadata], { account })
      } else if (hasMemberlistPermissions && (useExternalUrl || !isAnyTrancheOpen)) {
        // remove onboarding-api proxy from pool permissions
        updatePermissionAndConfigTx([[], [[investorAdmin, 'InvestorAdmin']], amendedMetadata], { account })
      } else {
        updateConfigTx([poolId, amendedMetadata], { account })
      }
      actions.setSubmitting(true)
    },
  })

  const isLoading = isPermissionsLoading || isMetadataLoading

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
            <Text variant="heading4">Onboarding status</Text>
            <Stack gap={1}>
              {Object.entries(formik.values.openForOnboarding).map(([tId, open]) => (
                <Shelf width="100%" justifyContent="space-between" gap={2} key={tId}>
                  <Text variant="body1">{(pool.tranches as Token[]).find((t) => t.id === tId)?.currency.name}</Text>
                  <Shelf as="nav" bg="backgroundSecondary" borderRadius="4px" p="5px" width="fit-content">
                    <ToggleButton
                      forwardedAs="button"
                      $isActive={open}
                      disabled={!isEditing || formik.isSubmitting || isLoading}
                      type="button"
                      label={(pool.tranches as Token[]).find((t) => t.id === tId)?.currency.name}
                      onClick={() => {
                        formik.setFieldValue('openForOnboarding', {
                          ...formik.values.openForOnboarding,
                          [tId]: true,
                        })
                      }}
                    >
                      Open
                    </ToggleButton>
                    <ToggleButton
                      forwardedAs="button"
                      type="button"
                      $isActive={!open}
                      disabled={!isEditing || formik.isSubmitting || isLoading}
                      onClick={() => {
                        formik.setFieldValue('openForOnboarding', {
                          ...formik.values.openForOnboarding,
                          [tId]: false,
                        })
                      }}
                    >
                      Closed
                    </ToggleButton>
                  </Shelf>
                </Shelf>
              ))}
            </Stack>
            <Stack gap={2}>
              <Text variant="heading4">Onboarding provider</Text>
              <Shelf gap={1}>
                <RadioButton
                  disabled={!isEditing || formik.isSubmitting || isLoading}
                  checked={!useExternalUrl}
                  label="Centrifuge"
                  onChange={() => {
                    setUseExternalUrl(false)
                  }}
                />
                <RadioButton
                  disabled={!isEditing || formik.isSubmitting || isLoading}
                  checked={useExternalUrl}
                  label="Other"
                  onChange={() => {
                    setUseExternalUrl(true)
                  }}
                />
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
                  <Box key={`${tId}-sub-docs`}>
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
              <Text variant="heading4">POD read option</Text>
              <Checkbox
                label="Automatically give new investors access to private asset-level data"
                checked={formik.values.podReadAccess}
                onChange={(e) => formik.setFieldValue('podReadAccess', !!e.target.checked)}
                disabled={!isEditing || formik.isSubmitting || isLoading}
              />
            </Stack>
            <Stack gap={2}>
              <Text variant="heading4">Tax document requirement</Text>
              <Checkbox
                label="Require investors to upload tax documents before signing the subscription agreement"
                checked={formik.values.taxInfoRequired}
                onChange={(e) => formik.setFieldValue('taxInfoRequired', !!e.target.checked)}
                disabled={!isEditing || formik.isSubmitting || isLoading}
              />
            </Stack>
            <RestrictedCountriesTable isEditing={isEditing} isLoading={isLoading} formik={formik} type="KYB" />
            <RestrictedCountriesTable isEditing={isEditing} isLoading={isLoading} formik={formik} type="KYC" />
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

const RestrictedCountriesTable = ({
  formik,
  isLoading,
  isEditing,
  type,
}: {
  formik: FormikProps<OnboardingSettingsInput>
  isLoading: boolean
  isEditing: boolean
  type: 'KYC' | 'KYB'
}) => {
  const fieldArrayName = type === 'KYC' ? 'kycRestrictedCountries' : 'kybRestrictedCountries'
  const countryCodesEntries = type === 'KYC' ? Object.entries(KYC_COUNTRY_CODES) : Object.entries(KYB_COUNTRY_CODES)
  const countryCodesValues = type === 'KYC' ? Object.values(KYC_COUNTRY_CODES) : Object.values(KYB_COUNTRY_CODES)
  const countryValues = type === 'KYC' ? formik.values.kycRestrictedCountries : formik.values.kybRestrictedCountries
  return (
    <FieldArray name={fieldArrayName}>
      {(fldArr) => (
        <Stack gap={2}>
          <Text variant="heading4">Restricted onboarding countries ({type})</Text>
          <DefaultRestrictedCountries />
          {isEditing && !isLoading && (
            <>
              <SearchInput
                label={`Add restricted ${type} onboarding countries`}
                placeholder="Search country to add"
                disabled={!isEditing || formik.isSubmitting || isLoading}
                onChange={(e) => {
                  if (countryCodesValues.includes(e.target.value) && !countryValues.includes(e.target.value)) {
                    fldArr.push(e.target.value)
                  }
                }}
                list={fieldArrayName}
              />
              <datalist id={fieldArrayName}>
                {countryCodesEntries
                  .filter(([_, country]) => !countryValues.includes(country))
                  .map(([code, country]) => (
                    <option key={`${code}-kyc`} value={country} id={code} />
                  ))}
              </datalist>
            </>
          )}
          <Stack gap={3}>
            <DataTable
              data={countryValues.map((country, index) => ({ country, index }))}
              columns={[
                {
                  align: 'left',
                  header: 'Countries',
                  cell: (row: Row) => <Text variant="body2">{row.country}</Text>,
                },
                {
                  header: '',
                  cell: (row: Row) =>
                    isEditing && (
                      <Button
                        variant="tertiary"
                        icon={IconMinusCircle}
                        onClick={() => fldArr.remove(row.index)}
                        disabled={isLoading}
                      />
                    ),
                  width: '72px',
                },
              ]}
            />
          </Stack>
        </Stack>
      )}
    </FieldArray>
  )
}

const ToggleButton = styled(Text)<{ isActive: boolean }>`
  appearance: none;
  border: 0;
  cursor: pointer;
  display: block;
  padding: 7px 16px 8px 16px;
  border-radius: 4px;

  color: ${({ theme, $isActive }) => ($isActive ? theme.colors.textInteractive : theme.colors.textPrimary)};
  font-size: ${({ theme }) => theme.typography.interactive2.fontSize}px;
  line-height: ${({ theme }) => theme.typography.interactive2.lineHeight};
  font-weight: ${({ theme }) => theme.typography.interactive2.fontWeight};

  box-shadow: ${({ theme, $isActive }) => ($isActive ? theme.shadows.buttonSecondary : 'none')};
  background: ${({ theme, $isActive }) => ($isActive ? theme.colors.backgroundPage : theme.colors.backgroundSecondary)};

  ${({ disabled, theme }) =>
    disabled &&
    `
    cursor: not-allowed;
    color: ${theme.colors.textDisabled};
  `}
`
