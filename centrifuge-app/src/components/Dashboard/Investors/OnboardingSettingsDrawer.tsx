import { Account, addressToHex, PoolMetadata, PoolRoleInput, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  Accordion,
  Box,
  Button,
  Divider,
  Drawer,
  FileUpload,
  IconButton,
  IconTrash,
  RadioButton,
  SearchInput,
  Select,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import { combineLatest, lastValueFrom, switchMap, takeWhile } from 'rxjs'
import {
  KYB_COUNTRY_CODES,
  KYC_COUNTRY_CODES,
  RESTRICTED_COUNTRY_CODES,
} from '../../../pages/Onboarding/geographyCodes'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { usePoolPermissions, useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata, usePoolMetadataMulti } from '../../../utils/usePools'
import { Column, DataTable } from '../../DataTable'

export function OnboardingSettingsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { pools } = useSelectedPools(true)
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(pools?.[0]?.id ?? null)
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Onboarding Settings">
      <Select
        label="Select the pool to edit"
        options={
          pools?.map((pool) => ({
            label: poolMetadata.find((p) =>
              Object.keys(p.data?.tranches ?? {}).find((tId) => tId === pool.tranches[0].id)
            )?.data?.pool?.name,
            value: pool.id,
          })) ?? []
        }
        id="poolId"
        name="poolId"
        value={selectedPoolId ?? ''}
        onChange={(event) => {
          setSelectedPoolId(event.target.value)
        }}
      />
      {selectedPoolId && <OnboardingSettings poolId={selectedPoolId} onClose={onClose} />}
    </Drawer>
  )
}

function OnboardingSettingsAccordion({
  children,
  ...props
}: {
  children: React.ReactNode
  props?: React.CSSProperties
}) {
  return (
    <Stack
      borderRadius={8}
      mb={4}
      py={3}
      px={2}
      gap={3}
      backgroundColor="backgroundSecondary"
      borderStyle="solid"
      borderWidth={1}
      borderColor="borderPrimary"
      {...props}
    >
      {children}
    </Stack>
  )
}

type OnboardingFormValues = {
  onboardingExperience: 'centrifuge' | 'other' | 'none'
  tranches: { [trancheId: string]: { agreement: undefined | File; openForOnboarding: boolean } }
  kybRestrictedCountries: { label: string; value: string }[]
  kycRestrictedCountries: { label: string; value: string }[]
  externalOnboardingUrl?: string
  taxInfoRequired?: boolean
}

const initialValues: OnboardingFormValues = {
  onboardingExperience: 'centrifuge',
  tranches: {},
  kybRestrictedCountries: [],
  kycRestrictedCountries: [],
  externalOnboardingUrl: '',
  taxInfoRequired: true,
}

function OnboardingSettings({ poolId, onClose }: { poolId: string; onClose: () => void }) {
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const centrifuge = useCentrifuge()
  const [countrySearch, setCountrySearch] = useState('')
  const permissions = usePoolPermissions(poolId)
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })
  const isOpenForOnboarding = Object.values(poolMetadata?.onboarding?.tranches ?? {}).some((t) => t.openForOnboarding)
  const [formInitialValues, setFormInitialValues] = useState<OnboardingFormValues>(initialValues)

  const baseInitialValues = useMemo(
    () => ({
      onboardingExperience: poolMetadata?.onboarding?.externalOnboardingUrl
        ? 'other'
        : isOpenForOnboarding
        ? 'centrifuge'
        : ('none' as 'centrifuge' | 'other' | 'none'),
      tranches: (pool.tranches as Token[]).reduce((prevT, currT) => {
        const agreementUrl = poolMetadata?.onboarding?.tranches?.[currT.id]?.agreement?.uri
          ? centrifuge.metadata.parseMetadataUrl(poolMetadata.onboarding.tranches[currT.id].agreement!.uri)
          : undefined
        return {
          ...prevT,
          [currT.id]: poolMetadata?.onboarding?.tranches?.[currT.id]?.agreement
            ? {
                agreement: agreementUrl,
                openForOnboarding: poolMetadata.onboarding.tranches[currT.id].openForOnboarding,
                trancheId: currT.id,
              }
            : undefined,
        }
      }, {}),
      kybRestrictedCountries:
        poolMetadata?.onboarding?.kybRestrictedCountries?.map((c) => ({
          label: KYB_COUNTRY_CODES[c as keyof typeof KYB_COUNTRY_CODES],
          value: c,
        })) ?? [],
      kycRestrictedCountries:
        poolMetadata?.onboarding?.kycRestrictedCountries?.map((c) => ({
          label: KYC_COUNTRY_CODES[c as keyof typeof KYC_COUNTRY_CODES],
          value: c,
        })) ?? [],
      externalOnboardingUrl: poolMetadata?.onboarding?.externalOnboardingUrl ?? '',
      taxInfoRequired: !!poolMetadata?.onboarding?.taxInfoRequired || true,
    }),
    [poolMetadata, pool.tranches, centrifuge.metadata, isOpenForOnboarding]
  )

  useEffect(() => {
    const loadFiles = async () => {
      const tranches = await Promise.all(
        pool.tranches.map(async (currT) => {
          const agreementUrl = poolMetadata?.onboarding?.tranches?.[currT.id]?.agreement?.uri
            ? centrifuge.metadata.parseMetadataUrl(poolMetadata.onboarding.tranches[currT.id].agreement!.uri)
            : undefined

          const file: File | undefined = agreementUrl
            ? await urlToFile(agreementUrl, `${currT.currency.displayName}-agreement.pdf`)
            : undefined
          return {
            agreement: file,
            openForOnboarding: poolMetadata?.onboarding?.tranches?.[currT.id]?.openForOnboarding,
            trancheId: currT.id,
          }
        })
      )

      const initialTranches = tranches.reduce((prevT, currT) => {
        return {
          ...prevT,
          [currT.trancheId]: currT,
        }
      }, {})

      setFormInitialValues({
        ...baseInitialValues,
        tranches: initialTranches,
      })
    }

    loadFiles()
  }, [baseInitialValues, pool.tranches, centrifuge.metadata, poolMetadata?.onboarding?.tranches])

  const { execute: updatePermissionAndConfigTx } = useCentrifugeTransaction(
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
      onError(error) {
        console.error(error)
      },
    }
  )

  const formik = useFormik<OnboardingFormValues>({
    initialValues: formInitialValues,
    enableReinitialize: true, // resets values when poolId changes
    onSubmit: async (values, actions) => {
      if (!values || !poolMetadata) {
        return
      }
      let onboardingTranches = {}
      for (const [tId, t] of Object.entries(values.tranches)) {
        if (values.onboardingExperience === 'centrifuge' && t.openForOnboarding && !t.agreement) {
          actions.setErrors({
            tranches: {
              [tId]: {
                agreement:
                  'To use the Centrifuge onboarding experience, you must upload a subscription document for each tranche.',
              },
            },
          })
          throw new Error('Subscription document is required')
        }

        if (!t.agreement) {
          onboardingTranches = {
            ...onboardingTranches,
            [tId]: {
              agreement: undefined,
              openForOnboarding: t?.openForOnboarding,
            },
          }
        }
        // file is already IPFS hash so it hasn't changed
        else if (typeof t.agreement === 'string') {
          onboardingTranches = {
            ...onboardingTranches,
            [tId]: {
              agreement: { uri: t.agreement, mime: 'application/pdf' },
              openForOnboarding: t?.openForOnboarding,
            },
          }
        } else if (t.agreement) {
          const uri = await getFileDataURI(t.agreement)
          const pinnedAgreement = await lastValueFrom(centrifuge.metadata.pinFile(uri))
          onboardingTranches = {
            ...onboardingTranches,
            [tId]: {
              agreement: {
                uri: centrifuge.metadata.parseMetadataUrl(pinnedAgreement.ipfsHash),
                mime: 'application/pdf',
              },
              openForOnboarding: t?.openForOnboarding,
            },
          }
        }
      }

      const kybRestrictedCountries = values.kybRestrictedCountries
        .map((country) => Object.entries(KYB_COUNTRY_CODES).find(([_c, _country]) => _c === country.value)?.[0] ?? '')
        .filter(Boolean)

      const kycRestrictedCountries = values.kycRestrictedCountries
        .map((country) => Object.entries(KYC_COUNTRY_CODES).find(([_c, _country]) => _c === country.value)?.[0] ?? '')
        .filter(Boolean)

      const amendedMetadata: PoolMetadata = {
        ...(poolMetadata as PoolMetadata),
        onboarding: {
          tranches: onboardingTranches,
          kycRestrictedCountries,
          kybRestrictedCountries,
          externalOnboardingUrl: values.onboardingExperience === 'other' ? values.externalOnboardingUrl : undefined,
          taxInfoRequired: values.taxInfoRequired,
        },
      }

      const investorAdmin = import.meta.env.REACT_APP_MEMBERLIST_ADMIN_PURE_PROXY
      const hasMemberlistPermissions = permissions?.[addressToHex(investorAdmin)]?.roles.includes('InvestorAdmin')
      const isAnyTrancheOpen = Object.values(values.tranches).some((t) => t?.openForOnboarding)
      if (!values.externalOnboardingUrl && isAnyTrancheOpen && !hasMemberlistPermissions) {
        // pool is open for onboarding and onboarding-api proxy is not in pool permissions
        updatePermissionAndConfigTx([[[investorAdmin, 'InvestorAdmin']], [], amendedMetadata], { account })
      } else if (hasMemberlistPermissions && (values.externalOnboardingUrl || !isAnyTrancheOpen)) {
        // remove onboarding-api proxy from pool permissions
        updatePermissionAndConfigTx([[], [[investorAdmin, 'InvestorAdmin']], amendedMetadata], { account })
      } else {
        updatePermissionAndConfigTx([[], [], amendedMetadata], { account })
      }
      actions.setSubmitting(true)
    },
  })

  const hasChanges = useMemo(() => {
    return JSON.stringify(formik.values) !== JSON.stringify(formInitialValues)
  }, [formik.values, formInitialValues])

  const uniqueCountries = [...formik.values.kybRestrictedCountries, ...formik.values.kycRestrictedCountries].filter(
    (country, index, self) => index === self.findIndex((c) => c.value === country.value)
  )

  const uniqueCountryCodesEntries = [...Object.entries(KYC_COUNTRY_CODES), ...Object.entries(KYB_COUNTRY_CODES)].filter(
    ([countryId], index, self) => index === self.findIndex(([cId]) => cId === countryId)
  )

  const shuftiUnsupportedCountries = Object.keys(RESTRICTED_COUNTRY_CODES).map((code) => ({
    label: RESTRICTED_COUNTRY_CODES[code as keyof typeof RESTRICTED_COUNTRY_CODES],
    value: code,
    canBeDeleted: false,
  }))

  const filteredOptions = useMemo(() => {
    const existingCountries = new Set(uniqueCountries.map((c) => c.label))

    return uniqueCountryCodesEntries
      .filter(([_, country]) => !existingCountries.has(country))
      .filter(([_, country]) => country.toLowerCase().includes(countrySearch.toLowerCase()))
      .map(([code, country]) => ({ label: country, value: code }))
  }, [uniqueCountryCodesEntries, uniqueCountries, countrySearch])

  const displayDataTable = formik.values.onboardingExperience === 'centrifuge' || uniqueCountries.length > 0

  return (
    <FormikProvider value={formik}>
      <Form>
        <Box display="flex" flexDirection="column" height="85vh">
          <Stack gap={0} flex={1} overflow="auto">
            <Divider />
            <Accordion
              items={[
                {
                  title: (
                    <Box paddingY={2}>
                      <Text variant="heading2">Details</Text>
                    </Box>
                  ),
                  body: (
                    <OnboardingSettingsAccordion>
                      <Stack gap={2}>
                        <Text variant="heading4">Onboarding experience</Text>
                        <Stack gap={2}>
                          <RadioButton
                            name="onboardingExperience"
                            border
                            height={44}
                            id="onboardingExperience"
                            checked={formik.values.onboardingExperience === 'centrifuge'}
                            label="Centrifuge"
                            onChange={() => {
                              formik.setFieldValue('onboardingExperience', 'centrifuge')
                            }}
                          />
                          <RadioButton
                            name="onboardingExperience"
                            id="onboardingExperience"
                            border
                            height={44}
                            checked={formik.values.onboardingExperience === 'none'}
                            label="None"
                            onChange={() => {
                              formik.setFieldValue('onboardingExperience', 'none')
                            }}
                          />
                          <RadioButton
                            name="onboardingExperience"
                            id="onboardingExperience"
                            height={44}
                            border
                            checked={formik.values.onboardingExperience === 'other'}
                            label="Other"
                            onChange={() => {
                              formik.setFieldValue('onboardingExperience', 'other')
                            }}
                          />
                        </Stack>
                        {formik.values.onboardingExperience === 'other' && (
                          <TextInput
                            value={formik.values.externalOnboardingUrl}
                            onChange={(e) => formik.setFieldValue('externalOnboardingUrl', e.target.value)}
                            placeholder="https://"
                            label="External onboarding url"
                            onBlur={formik.handleBlur}
                            errorMessage={
                              formik.errors.externalOnboardingUrl && formik.values.onboardingExperience === 'other'
                                ? formik.errors.externalOnboardingUrl
                                : undefined
                            }
                          />
                        )}
                        {formik.values.onboardingExperience === 'centrifuge' && (
                          <Stack gap={2} justifyContent="flex-end">
                            {Object.entries(formik?.values?.tranches ?? {}).map(([tId]) => {
                              return (
                                <Shelf key={`${tId}-sub-docs`} gap={1} alignItems="flex-end">
                                  <Box flex={1}>
                                    <Select
                                      options={[
                                        { label: 'Open', value: 'open' },
                                        { label: 'Closed', value: 'closed' },
                                      ]}
                                      label={`${
                                        (pool.tranches as Token[])?.find((t) => t.id === tId)?.currency.displayName
                                      }`}
                                      value={formik.values.tranches[tId]?.openForOnboarding ? 'open' : 'closed'}
                                      onChange={(event) => {
                                        const file = formik.values.tranches[tId]?.agreement
                                        formik.setFieldValue('tranches', {
                                          ...formik.values.tranches,
                                          [tId]: { agreement: file, openForOnboarding: event.target.value === 'open' },
                                        })
                                      }}
                                    />
                                  </Box>
                                  <Box flex={2}>
                                    <FileUpload
                                      small
                                      label={`Subscription document`}
                                      onFileChange={(file) => {
                                        const onboardingStatus = formik.values.tranches[tId]?.openForOnboarding
                                        formik.setFieldValue('tranches', {
                                          ...formik.values.tranches,
                                          [tId]: { agreement: file, openForOnboarding: onboardingStatus },
                                        })
                                      }}
                                      placeholder="Choose a file..."
                                      file={formik.values.tranches[tId]?.agreement ?? undefined}
                                      accept="application/pdf"
                                    />
                                  </Box>
                                </Shelf>
                              )
                            })}
                            {formik.errors?.tranches && (
                              <Text variant="body2" color="statusCritical">
                                {Object.values(formik.errors.tranches)
                                  .map((error) => error?.agreement)
                                  .join(', ')}
                              </Text>
                            )}
                            <Select
                              options={[
                                { label: 'No', value: 'false' },
                                { label: 'Yes', value: 'true' },
                              ]}
                              defaultValue="false"
                              label="Require investors to upload tax documents before signing the subscription agreement"
                              value={formik.values.taxInfoRequired ? 'true' : 'false'}
                              onChange={(e) => {
                                formik.setFieldValue('taxInfoRequired', e.target.value === 'true')
                              }}
                            />
                          </Stack>
                        )}
                      </Stack>
                    </OnboardingSettingsAccordion>
                  ),
                },

                {
                  title: (
                    <Box paddingY={2}>
                      <Text variant="heading2">Restricted countries</Text>
                    </Box>
                  ),
                  body: (
                    <OnboardingSettingsAccordion style={{ minHeight: displayDataTable ? 'auto' : '300px' }}>
                      <SearchInput
                        id="countrySearch"
                        label="Add restricted onboarding countries"
                        value={countrySearch}
                        dropdownOptions={filteredOptions}
                        onChange={(e) => {
                          setCountrySearch(e.target.value)
                        }}
                        onOptionSelect={(option) => {
                          setCountrySearch('')
                          formik.setFieldValue('kycRestrictedCountries', [
                            ...formik.values.kycRestrictedCountries,
                            { label: option.label, value: option.value },
                          ])
                          formik.setFieldValue('kybRestrictedCountries', [
                            ...formik.values.kybRestrictedCountries,
                            { label: option.label, value: option.value },
                          ])
                        }}
                      />

                      {displayDataTable && (
                        <Box backgroundColor="white" borderRadius={8}>
                          <DataTable
                            columns={
                              [
                                {
                                  header: 'Countries',
                                  cell: (row) => <Text textOverflow="ellipsis">{row.country}</Text>,
                                  align: 'left',
                                  width: '80%',
                                },
                                {
                                  header: '',
                                  width: '20%',
                                  cell: (row) => {
                                    if (row.canBeDeleted) {
                                      return (
                                        <IconButton
                                          disabled={!row.canBeDeleted}
                                          onClick={() => {
                                            formik.setFieldValue(
                                              'kycRestrictedCountries',
                                              formik.values.kycRestrictedCountries.filter((c) => c.value !== row.id)
                                            )
                                            formik.setFieldValue(
                                              'kybRestrictedCountries',
                                              formik.values.kybRestrictedCountries.filter((c) => c.value !== row.id)
                                            )
                                          }}
                                        >
                                          <IconTrash size="iconSmall" />
                                        </IconButton>
                                      )
                                    } else return null
                                  },
                                },
                              ] as Column[]
                            }
                            data={(formik.values.onboardingExperience === 'centrifuge'
                              ? [...uniqueCountries, ...shuftiUnsupportedCountries]
                              : uniqueCountries
                            ).map((c) => {
                              return {
                                country: c.label,
                                id: c.value,
                                canBeDeleted: 'canBeDeleted' in c ? c.canBeDeleted : true,
                              }
                            })}
                          />
                        </Box>
                      )}
                    </OnboardingSettingsAccordion>
                  ),
                },
              ]}
            />
          </Stack>
          <Stack gap={4}>
            <Divider />
            <Stack gap={2}>
              <Button small type="submit" disabled={formik.isSubmitting || !hasChanges || !!formik.errors.tranches}>
                Save
              </Button>
              <Button small variant="inverted" onClick={onClose}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Form>
    </FormikProvider>
  )
}

const urlToFile = async (url: string, filename: string): Promise<File | undefined> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
  } catch (error) {
    console.error('Error converting URL to File:', error)
    return undefined
  }
}
