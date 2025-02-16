import { CurrencyBalance, FileType, Pool, PoolMetadata, TrancheFormValues } from '@centrifuge/centrifuge-js'
import { Accordion, Box, Divider, Drawer, Select } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { LoadBoundary } from '../../../../src/components/LoadBoundary'
import { IssuerCategoriesSection } from '../../../../src/pages/IssuerCreatePool/IssuerCategories'
import { PoolAnalysisSection } from '../../../../src/pages/IssuerCreatePool/PoolAnalysisSection'
import { PoolRatingsSection } from '../../../../src/pages/IssuerCreatePool/PoolRatings'
import { TranchesSection } from '../../../../src/pages/IssuerCreatePool/TranchesSection'
import { usePoolAdmin } from '../../../../src/utils/usePermissions'
import { IssuerDetailsSection } from './IssuerDetailsSection'
import { PoolDescriptionSection } from './PoolDescriptionSection'

export type PoolWithMetadata = Pool & { meta: PoolMetadata }

type PoolConfigurationDrawerProps = {
  open: boolean
  setOpen: (open: boolean) => void
  pools: PoolWithMetadata[]
}

export type CreatePoolFormValues = {
  pool: {
    id: string
    poolName: string
    investorType: string
    poolIcon: string
    assetDenomination: string
    assetClass: string
    subAssetClass: string
    issuerName: string
    repName: string
    issuerLogo: string
    issuerShortDescription: string
    issuerDescription: string
  }
  issuerCategories: {
    type?: string
    description?: string
  }[]
  poolRatings: {
    agency?: string
    value?: string
    reportUrl?: string
    reportFile?: FileType | null
  }[]
  reportUrl: string
  reportAuthorName: string
  reportAuthorTitle: string
  reportAuthorAvatar: string
  tranches: TrancheFormValues[]
}

export function PoolConfigurationDrawer({ open, setOpen, pools }: PoolConfigurationDrawerProps) {
  const form = useFormik<CreatePoolFormValues>({
    initialValues: {
      pool: {
        poolName: pools?.[0]?.meta?.pool?.name ?? '',
        investorType: pools?.[0]?.meta?.pool?.investorType ?? '',
        id: pools?.[0]?.id ?? '',
        poolIcon: pools?.[0]?.meta?.pool?.icon?.uri ?? '',
        assetDenomination: pools?.[0]?.currency.symbol ?? 'USDC',
        assetClass: pools?.[0]?.meta?.pool?.asset.class ?? '',
        subAssetClass: pools?.[0]?.meta?.pool?.asset.subClass ?? '',
        issuerName: pools?.[0]?.meta?.pool?.issuer?.name ?? '',
        repName: pools?.[0]?.meta?.pool?.issuer?.repName ?? '',
        issuerLogo: pools?.[0]?.meta?.pool?.issuer?.logo?.uri ?? '',
        issuerShortDescription: pools?.[0]?.meta?.pool?.issuer?.shortDescription ?? '',
        issuerDescription: pools?.[0]?.meta?.pool?.issuer?.description ?? '',
      },
      issuerCategories: pools?.[0]?.meta?.pool?.issuer?.categories ?? [{ type: '', description: '' }],
      poolRatings: pools?.[0]?.meta?.pool?.poolRatings ?? [{ agency: '', value: '', reportUrl: '', reportFile: null }],
      reportUrl: pools?.[0]?.meta?.pool?.reports?.[0]?.uri ?? '',
      reportAuthorName: pools?.[0]?.meta?.pool?.reports?.[0]?.author?.name ?? '',
      reportAuthorTitle: pools?.[0]?.meta?.pool?.reports?.[0]?.author?.title ?? '',
      reportAuthorAvatar: pools?.[0]?.meta?.pool?.reports?.[0]?.author?.avatar?.uri ?? '',
      tranches:
        pools?.[0]?.tranches.map((tranche) => {
          const trancheMetadata = pools?.[0]?.meta?.tranches?.[tranche.id]
          return {
            tokenName: tranche.currency.name,
            symbolName: tranche.currency.symbol,
            minRiskBuffer: tranche.minRiskBuffer?.toPercent().toNumber() ?? '',
            minInvestment: trancheMetadata?.minInitialInvestment
              ? new CurrencyBalance(trancheMetadata.minInitialInvestment, tranche.currency.decimals).toFloat()
              : '',
            apy: trancheMetadata?.apy ? trancheMetadata?.apy : '',
            interestRate: tranche.interestRatePerSec?.toAprPercent().toNumber() ?? '',
            apyPercentage: trancheMetadata?.apyPercentage ?? null,
          }
        }) ?? [],
    },
    onSubmit: (values) => {
      console.log(values)
    },
  })

  const isPoolAdmin = !!usePoolAdmin(form.values.pool.id)

  const resetToDefault = () => {
    form.resetForm()
    setOpen(false)
  }

  return (
    <LoadBoundary>
      <Drawer isOpen={open} onClose={resetToDefault} title="Edit configuration">
        <Divider color="backgroundSecondary" />
        <FormikProvider value={form}>
          <Form noValidate>
            <Box px={1}>
              <Field name="poolId">
                {({ field, form }: FieldProps) => (
                  <Select
                    name="poolId"
                    label="Select pool"
                    value={field.value}
                    options={pools?.map((pool) => ({ label: pool?.meta?.pool?.name, value: pool.id }))}
                    onChange={(event) => {
                      const selectedPool = pools.find((pool) => pool.id === event.target.value)
                      console.log(selectedPool)
                      form.setFieldValue('pool', {
                        id: selectedPool?.id ?? '',
                        poolName: selectedPool?.meta?.pool?.name ?? '',
                        investorType: selectedPool?.meta?.pool?.investorType ?? '',
                        poolIcon: selectedPool?.meta?.pool?.icon?.uri ?? '',
                        assetDenomination: selectedPool?.currency.symbol ?? 'USDC',
                        assetClass: selectedPool?.meta?.pool?.asset.class ?? '',
                        subAssetClass: selectedPool?.meta?.pool?.asset.subClass ?? '',
                        issuerName: selectedPool?.meta?.pool?.issuer?.name ?? '',
                        repName: selectedPool?.meta?.pool?.issuer?.repName ?? '',
                        issuerLogo: selectedPool?.meta?.pool?.issuer?.logo?.uri ?? '',
                        issuerShortDescription: selectedPool?.meta?.pool?.issuer?.shortDescription ?? '',
                        issuerDescription: selectedPool?.meta?.pool?.issuer?.description ?? '',
                      })
                      form.setFieldValue('issuerCategories', selectedPool?.meta?.pool?.issuer?.categories ?? [])
                      form.setFieldValue('poolRatings', selectedPool?.meta?.pool?.poolRatings ?? [])
                      form.setFieldValue('reportUrl', selectedPool?.meta?.pool?.reports?.[0]?.uri ?? '')
                      form.setFieldValue('reportAuthorName', selectedPool?.meta?.pool?.reports?.[0]?.author?.name ?? '')
                      form.setFieldValue(
                        'reportAuthorTitle',
                        selectedPool?.meta?.pool?.reports?.[0]?.author?.title ?? ''
                      )
                      form.setFieldValue(
                        'reportAuthorAvatar',
                        selectedPool?.meta?.pool?.reports?.[0]?.author?.avatar?.uri ?? ''
                      )
                      form.setFieldValue(
                        'tranches',
                        selectedPool?.tranches.map((tranche) => {
                          const trancheMetadata = selectedPool?.meta?.tranches?.[tranche.id]
                          return {
                            tokenName: tranche.currency.name,
                            symbolName: tranche.currency.symbol,
                            minRiskBuffer: tranche.minRiskBuffer?.toPercent().toNumber() ?? '',
                            minInvestment: trancheMetadata?.minInitialInvestment
                              ? new CurrencyBalance(
                                  trancheMetadata.minInitialInvestment,
                                  tranche.currency.decimals
                                ).toFloat()
                              : '',
                            apy: trancheMetadata?.apy ? trancheMetadata?.apy : '',
                            interestRate: tranche.interestRatePerSec?.toAprPercent().toNumber() ?? '',
                            apyPercentage: trancheMetadata?.apyPercentage ?? null,
                          }
                        })
                      )
                    }}
                  />
                )}
              </Field>
            </Box>
            {isPoolAdmin && (
              <Box mt={2}>
                <Accordion
                  items={[
                    {
                      title: 'Pool description',
                      body: <PoolDescriptionSection />,
                    },
                    {
                      title: 'Issuer details',
                      body: <IssuerDetailsSection />,
                    },
                    {
                      title: 'Service providers',
                      body: <IssuerCategoriesSection hideTitle />,
                    },
                    {
                      title: 'Pool ratings',
                      body: <PoolRatingsSection hideTitle />,
                    },
                    {
                      title: 'Pool analysis',
                      body: <PoolAnalysisSection hideTitle />,
                    },
                    {
                      title: 'Tranche structure',
                      body: <TranchesSection hideTitle />,
                    },
                  ]}
                />
              </Box>
            )}
          </Form>
        </FormikProvider>
      </Drawer>
    </LoadBoundary>
  )
}
