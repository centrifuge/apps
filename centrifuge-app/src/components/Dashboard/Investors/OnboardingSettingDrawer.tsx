import { Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  Accordion,
  Box,
  Divider,
  Drawer,
  FileUpload,
  RadioButton,
  Select,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import { KYB_COUNTRY_CODES, KYC_COUNTRY_CODES } from '../../../pages/Onboarding/geographyCodes'
import { usePool, usePoolMetadata, usePoolMetadataMulti, usePools } from '../../../utils/usePools'

export function OnboardingSettingDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pools = usePools()
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(pools?.[0]?.id ?? null)
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="33%" innerPaddingTop={3}>
      <Text variant="heading2" fontWeight="600">
        Onboarding Settings
      </Text>
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
      <Divider />
      {selectedPoolId && <OnboardingSettings poolId={selectedPoolId} />}
    </Drawer>
  )
}

function OnboardingSettingsAccordion({ children }: { children: React.ReactNode }) {
  return (
    <Stack borderRadius={8} py={3} px={2} gap={3} backgroundColor="backgroundSecondary">
      {children}
    </Stack>
  )
}

type OnboardingFormValues = {
  onboardingExperience: 'centrifuge' | 'other' | 'none'
  tranches: { [trancheId: string]: { agreement: undefined | File; openForOnboarding: boolean; trancheId: string } }
  kybRestrictedCountries?: string[]
  kycRestrictedCountries?: string[]
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

function OnboardingSettings({ poolId }: { poolId: string }) {
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const centrifuge = useCentrifuge()
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
        poolMetadata?.onboarding?.kybRestrictedCountries?.map(
          (c) => KYB_COUNTRY_CODES[c as keyof typeof KYB_COUNTRY_CODES]
        ) ?? [],
      kycRestrictedCountries:
        poolMetadata?.onboarding?.kycRestrictedCountries?.map(
          (c) => KYC_COUNTRY_CODES[c as keyof typeof KYC_COUNTRY_CODES]
        ) ?? [],
      externalOnboardingUrl: poolMetadata?.onboarding?.externalOnboardingUrl ?? '',
      taxInfoRequired: !!poolMetadata?.onboarding?.taxInfoRequired || true,
      agreements: pool.tranches.map((currT) => ({
        agreementUrl: '',
        trancheId: currT.id,
      })),
    }),
    [poolMetadata, pool.tranches]
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
  }, [baseInitialValues, pool.tranches])

  const formik = useFormik<OnboardingFormValues>({
    initialValues: formInitialValues,
    enableReinitialize: true, // resets values when poolId changes
    onSubmit: (values) => {
      console.log(values)
    },
  })

  return (
    <FormikProvider value={formik}>
      <Form>
        <Accordion
          items={[
            {
              title: <Text variant="heading2">Details</Text>,
              body: (
                <OnboardingSettingsAccordion>
                  {/* <Select
                    options={[
                      { label: 'Open', value: 'open' },
                      { label: 'Closed', value: 'closed' },
                    ]}
                    label="Onboarding status"
                    value={formik.values.onboardingStatus}
                    onChange={(event) => {
                      formik.setFieldValue('onboardingStatus', event.target.value)
                    }}
                  /> */}
                  <Stack gap={2}>
                    <Text variant="heading4">Onboarding experience</Text>
                    <Stack gap={2}>
                      <RadioButton
                        id="onboardingExperience"
                        checked={formik.values.onboardingExperience === 'centrifuge'}
                        label="Centrifuge"
                        onChange={() => {
                          formik.setFieldValue('onboardingExperience', 'centrifuge')
                        }}
                      />
                      <RadioButton
                        checked={formik.values.onboardingExperience === 'none'}
                        label="None"
                        id="onboardingExperience"
                        onChange={() => {
                          formik.setFieldValue('onboardingExperience', 'none')
                        }}
                      />
                      <RadioButton
                        checked={formik.values.onboardingExperience === 'other'}
                        label="Other"
                        id="onboardingExperience"
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
                      <Stack gap={2}>
                        {Object.entries(poolMetadata?.onboarding?.tranches ?? {}).map(([tId]) => {
                          return (
                            <Box key={`${tId}-sub-docs`}>
                              <FileUpload
                                small
                                label={`Subscription document for ${
                                  (pool.tranches as Token[])?.find((t) => t.id === tId)?.currency.displayName
                                }`}
                                onFileChange={(file) => {
                                  formik.setFieldValue('tranches', {
                                    ...formik.values.tranches,
                                    [tId]: { agreement: file, openForOnboarding: true, trancheId: tId },
                                  })
                                }}
                                placeholder="Choose a file..."
                                file={formik.values.tranches[tId]?.agreement ?? undefined}
                                accept="application/pdf"
                              />
                            </Box>
                          )
                        })}
                      </Stack>
                    )}
                  </Stack>
                </OnboardingSettingsAccordion>
              ),
            },
          ]}
        />
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
