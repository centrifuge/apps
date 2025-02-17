import { CurrencyBalance, FileType, Perquintill, Pool, PoolMetadata, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Accordion, Box, Button, Divider, Drawer, Grid, Select } from '@centrifuge/fabric'
import { CurrencyMetadata } from '@centrifuge/sdk'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { lastValueFrom } from 'rxjs'
import { LoadBoundary } from '../../../../src/components/LoadBoundary'
import { IssuerCategoriesSection } from '../../../../src/pages/IssuerCreatePool/IssuerCategories'
import { PoolAnalysisSection } from '../../../../src/pages/IssuerCreatePool/PoolAnalysisSection'
import { PoolRatingsSection } from '../../../../src/pages/IssuerCreatePool/PoolRatings'
import { TranchesSection } from '../../../../src/pages/IssuerCreatePool/TranchesSection'
import { getFileDataURI } from '../../../../src/utils/getFileDataURI'
import { usePrefetchMetadata } from '../../../../src/utils/useMetadata'
import { usePoolAdmin, useSuitableAccounts } from '../../../../src/utils/usePermissions'
import { IssuerDetailsSection } from './IssuerDetailsSection'
import { PoolDescriptionSection } from './PoolDescriptionSection'

export type PoolWithMetadata = Pool & { meta: PoolMetadata }

type PoolConfigurationDrawerProps = {
  open: boolean
  setOpen: (open: boolean) => void
  pools: PoolWithMetadata[]
}

export type UpdatePoolFormValues = {
  id: string
  poolName: string
  investorType: string
  poolIcon: string
  assetDenomination: string
  assetClass: 'Public credit' | 'Private credit'
  subAssetClass: string
  issuerName: string
  repName: string
  issuerLogo: string
  issuerShortDescription: string
  issuerDescription: string
  tranches: {
    tokenName: string
    symbolName: string
    minRiskBuffer: number
    minInvestment: number
    apy: string
    interestRate: number
    apyPercentage: number | null
    id: string
  }[]
  issuerCategories: {
    type?: string
    description?: string
  }[]
  poolRatings: {
    agency?: string
    value?: string
    reportUrl?: string
    reportFile?: string | File | FileType | null
  }[]
  reportUrl: string
  reportAuthorName: string
  reportAuthorTitle: string
  reportAuthorAvatar: string
  currency: CurrencyMetadata
}

export function PoolConfigurationDrawer({ open, setOpen, pools }: PoolConfigurationDrawerProps) {
  const cent = useCentrifuge()
  const prefetchMetadata = usePrefetchMetadata()
  const [isEditing, setIsEditing] = useState(false)

  const { execute, isLoading } = useCentrifugeTransaction('Update configuration', (cent) => cent.pools.setMetadata, {
    onSuccess: () => {
      setIsEditing(false)
      resetToDefault()
    },
  })

  const initialValues = useMemo(() => {
    return {
      poolName: pools?.[0]?.meta?.pool?.name ?? '',
      investorType: pools?.[0]?.meta?.pool?.investorType ?? '',
      id: pools?.[0]?.id ?? '',
      currency: pools?.[0]?.currency ?? '',
      poolIcon: pools?.[0]?.meta?.pool?.icon?.uri ?? '',
      assetDenomination: pools?.[0]?.currency.symbol ?? 'USDC',
      assetClass: pools?.[0]?.meta?.pool?.asset?.class ?? '',
      subAssetClass: pools?.[0]?.meta?.pool?.asset?.subClass ?? '',
      issuerName: pools?.[0]?.meta?.pool?.issuer?.name ?? '',
      repName: pools?.[0]?.meta?.pool?.issuer?.repName ?? '',
      issuerLogo: pools?.[0]?.meta?.pool?.issuer?.logo?.uri ?? '',
      issuerShortDescription: pools?.[0]?.meta?.pool?.issuer?.shortDescription ?? '',
      issuerDescription: pools?.[0]?.meta?.pool?.issuer?.description ?? '',
      reportUrl: pools?.[0]?.meta?.pool?.reports?.[0]?.uri ?? '',
      reportAuthorName: pools?.[0]?.meta?.pool?.reports?.[0]?.author?.name ?? '',
      reportAuthorTitle: pools?.[0]?.meta?.pool?.reports?.[0]?.author?.title ?? '',
      reportAuthorAvatar: pools?.[0]?.meta?.pool?.reports?.[0]?.author?.avatar?.uri ?? '',
      tranches: pools?.[0]?.tranches.map((tranche) => {
        const trancheMetadata = pools?.[0]?.meta?.tranches?.[tranche.id]
        return {
          tokenName: tranche.currency.name,
          symbolName: tranche.currency.symbol,
          minRiskBuffer: tranche.minRiskBuffer?.toPercent().toNumber() ?? 0,
          minInvestment: trancheMetadata?.minInitialInvestment
            ? new CurrencyBalance(trancheMetadata.minInitialInvestment, tranche.currency.decimals).toFloat()
            : 0,
          apy: trancheMetadata?.apy ? trancheMetadata?.apy : '',
          interestRate: tranche.interestRatePerSec?.toAprPercent().toNumber() ?? 0,
          apyPercentage: trancheMetadata?.apyPercentage ?? null,
          id: tranche.id,
        }
      }),
      issuerCategories: pools?.[0]?.meta?.pool?.issuer?.categories ?? [{ type: '', value: '', description: '' }],
      poolRatings:
        (pools?.[0]?.meta?.pool?.poolRatings?.length ?? 0) > 0
          ? pools![0]!.meta!.pool!.poolRatings!
          : [{ agency: '', value: '', reportUrl: '', reportFile: '' }],
    }
  }, [pools])

  const form = useFormik<UpdatePoolFormValues>({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (values, actions) => {
      console.log('onSubmit triggered', values)
      setIsEditing(true)
      const oldMetadata = initialValues as any
      let reportUrl
      let logoUri
      let avatar

      const pinFile = async (file: File) => {
        const pinned = await lastValueFrom(cent.metadata.pinFile(await getFileDataURI(file as File)))
        return { uri: pinned.uri, mime: (file as File).type }
      }

      // If the user has uploaded a report, the type is going to be File instead of string
      if (values.reportUrl && typeof values.reportUrl !== 'string') {
        reportUrl = (await pinFile(values.reportUrl)).uri
        prefetchMetadata(reportUrl)
      }
      // If the user has uploaded a new logo, the type is going to be File instead of string
      if (values.issuerLogo && typeof values.issuerLogo !== 'string') {
        logoUri = (await pinFile(values.issuerLogo)).uri
        prefetchMetadata(logoUri)
      }

      // If the user has uploaded a new avatar, the type is going to be File instead of string
      if (values.reportAuthorAvatar && typeof values.reportAuthorAvatar !== 'string') {
        const pinned = await pinFile(values.reportAuthorAvatar as File)
        avatar = { uri: pinned.uri, mime: (values.reportAuthorAvatar as File).type }
      }

      const newPoolMetadata: PoolMetadata = {
        pool: {
          issuer: {
            name: values.issuerName,
            repName: values.repName,
            description: values.issuerDescription,
            logo: logoUri && typeof logoUri !== 'string' ? { uri: logoUri } : oldMetadata.issuerLogo,
            shortDescription: values.issuerShortDescription,
            categories:
              values.issuerCategories.length === 1 && values.issuerCategories[0].type !== ''
                ? values.issuerCategories
                : oldMetadata.issuerCategories,
          },
          asset: {
            class: values.assetClass,
            subClass: values.subAssetClass,
          },
          name: values.poolName,
          investorType: values.investorType,
          poolIcon: values.poolIcon,
        },
      }

      if (values.reportUrl && typeof values.reportUrl !== 'string') {
        newPoolMetadata.pool.reports = [
          {
            author: {
              avatar: avatar || null,
              name: values.reportAuthorName,
              title: values.reportAuthorTitle,
            },
            uri: values.reportUrl,
          },
        ]
      }

      if (values.poolRatings) {
        const updatedRatings = await Promise.all(
          values.poolRatings.map(async (newRating, index) => {
            const existingRating = oldMetadata.poolRatings?.[index]

            if (JSON.stringify(newRating) === JSON.stringify(existingRating)) {
              return existingRating
            }

            const newReportFile = typeof newRating.reportFile === 'object' ? newRating.reportFile : null
            // remove the existing reportFile from the newRating so we don't accidentally overwrite it with the string representation
            // the existing reportFile will still be captured in the existingRating
            delete newRating.reportFile
            const mergedRating = { ...existingRating, ...newRating }

            if (newReportFile) {
              try {
                const pinnedFile = await pinFile(newReportFile)
                mergedRating.reportFile = pinnedFile
              } catch (error) {
                console.error('Error pinning file:', error)
              }
            }

            return mergedRating
          })
        )

        newPoolMetadata.pool.poolRatings = updatedRatings as PoolMetadata['pool']['poolRatings']
      }

      // tranches
      if (values.tranches) {
        const nonJuniorTranches = values.tranches.slice(1)
        const tranches = [
          {
            tokenName: values.tranches[0].tokenName,
            tokenSymbol: values.tranches[0].symbolName,
            id: values.tranches[0].id,
            apy: values.tranches[0].apy,
            apyPercentage: values.tranches[0].apyPercentage,
            minInitialInvestment: CurrencyBalance.fromFloat(
              values.tranches[0].minInvestment,
              values.currency.decimals
            ).toString(),
          }, // most junior tranche
          ...nonJuniorTranches.map((tranche) => ({
            interestRatePerSec: Rate.fromAprPercent(tranche.interestRate),
            minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer),
            tokenName: tranche.tokenName,
            tokenSymbol: tranche.symbolName,
            id: tranche.id,
          })),
        ]
        newPoolMetadata.tranches = Object.fromEntries(tranches.map((tranche) => [tranche.id, tranche]))
      }

      execute([values.id, newPoolMetadata], { account })
      actions.setSubmitting(false)
    },
  })

  // form variables
  const isPoolAdmin = !!usePoolAdmin(form.values.id)
  const [account] = useSuitableAccounts({ poolId: form.values.id, poolRole: ['PoolAdmin'] })

  const resetToDefault = () => {
    form.resetForm()
    setOpen(false)
    setIsEditing(false)
  }

  if (!pools.length) return

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
                    options={pools?.map((pool) => ({
                      label: pool?.meta?.pool?.name,
                      value: pool.id,
                    }))}
                    onChange={(event) => {
                      const selectedPool = pools.find((pool) => pool.id === event.target.value)
                      const newValues = {
                        id: selectedPool?.id ?? '',
                        poolName: selectedPool?.meta?.pool?.name ?? '',
                        investorType: selectedPool?.meta?.pool?.investorType ?? '',
                        poolIcon: selectedPool?.meta?.pool?.icon?.uri ?? '',
                        assetDenomination: selectedPool?.currency.symbol ?? 'USDC',
                        assetClass: selectedPool?.meta?.pool?.asset?.class ?? '',
                        subAssetClass: selectedPool?.meta?.pool?.asset?.subClass ?? '',
                        issuerName: selectedPool?.meta?.pool?.issuer?.name ?? '',
                        repName: selectedPool?.meta?.pool?.issuer?.repName ?? '',
                        issuerLogo: selectedPool?.meta?.pool?.issuer?.logo?.uri ?? '',
                        issuerShortDescription: selectedPool?.meta?.pool?.issuer?.shortDescription ?? '',
                        issuerDescription: selectedPool?.meta?.pool?.issuer?.description ?? '',
                        issuerCategories: selectedPool?.meta?.pool?.issuer?.categories ?? [],
                        poolRatings: selectedPool?.meta?.pool?.poolRatings ?? [],
                        reportUrl: selectedPool?.meta?.pool?.reports?.[0]?.uri ?? '',
                        reportAuthorName: selectedPool?.meta?.pool?.reports?.[0]?.author?.name ?? '',
                        reportAuthorTitle: selectedPool?.meta?.pool?.reports?.[0]?.author?.title ?? '',
                        reportAuthorAvatar: selectedPool?.meta?.pool?.reports?.[0]?.author?.avatar?.uri ?? '',
                        currency: selectedPool?.currency,
                        tranches: selectedPool?.tranches.map((tranche) => {
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
                        }),
                      }

                      form.setValues({
                        ...form.values,
                        ...newValues,
                      })
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
                      body: <IssuerCategoriesSection isUpdating />,
                    },
                    {
                      title: 'Pool ratings',
                      body: <PoolRatingsSection isUpdating />,
                    },
                    {
                      title: 'Pool analysis',
                      body: <PoolAnalysisSection isUpdating />,
                    },
                    {
                      title: 'Tranche structure',
                      body: <TranchesSection isUpdating />,
                    },
                  ]}
                />
              </Box>
            )}
            <Grid gap={2} display="flex" justifyContent="flex-end" flexDirection="column" marginTop="30%">
              <Button onClick={form.submitForm} loading={isEditing || isLoading} type="submit">
                Update
              </Button>
              <Button variant="inverted" onClick={resetToDefault}>
                Cancel
              </Button>
            </Grid>
          </Form>
        </FormikProvider>
      </Drawer>
    </LoadBoundary>
  )
}
