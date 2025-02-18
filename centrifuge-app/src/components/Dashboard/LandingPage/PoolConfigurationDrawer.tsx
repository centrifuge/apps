import {
  CurrencyBalance,
  CurrencyMetadata,
  FileType,
  Perquintill,
  Pool,
  PoolMetadata,
  Rate,
} from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Accordion, Box, Button, Divider, Drawer, Grid, Select } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { useState } from 'react'
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

export type UpdatePoolFormValues = Omit<PoolMetadata, 'tranches'> & {
  id: string
  currency: CurrencyMetadata
  tranches: {
    id: string
    tokenName: string
    symbolName: string
    index: number
    apy: number
    apyPercentage: number
    minInitialInvestment: string
  }[]
}

const createPoolSkeleton = (pool: PoolWithMetadata) => {
  if (!pool) return {}
  return {
    id: pool?.id,
    currency: pool?.currency,
    ...pool?.meta,
    pool: {
      ...pool?.meta?.pool,
      issuer: {
        ...pool?.meta?.pool?.issuer,
        categories:
          pool?.meta?.pool?.issuer?.categories?.length > 1
            ? pool?.meta?.pool?.issuer?.categories
            : [{ type: '', value: '' }],
      },
      poolRatings: !!pool?.meta?.pool?.poolRatings?.length
        ? pool.meta.pool.poolRatings
        : [{ agency: '', value: '', reportUrl: '' }],
      report: !!pool?.meta?.pool?.report
        ? pool.meta.pool.report
        : { author: { name: '', title: '', avatar: null }, url: '' },
    },
    tranches: pool.tranches.map((tranche) => {
      const trancheMeta = pool?.meta?.tranches[tranche.id]
      return {
        id: tranche.id,
        index: tranche.index,
        tokenName: tranche.currency.name,
        symbolName: tranche.currency.symbol,
        minRiskBuffer: tranche.minRiskBuffer,
        minInvestment: trancheMeta?.minInitialInvestment,
        apy: trancheMeta?.apy,
        apyPercentage: trancheMeta?.apyPercentage,
        interestRate: tranche.index !== 0 ? tranche.interestRatePerSec : null,
      }
    }),
  }
}

export function PoolConfigurationDrawer({ open, setOpen, pools }: PoolConfigurationDrawerProps) {
  const cent = useCentrifuge()
  const pool = pools?.[3]
  const prefetchMetadata = usePrefetchMetadata()
  const [isEditing, setIsEditing] = useState(false)

  const { execute, isLoading } = useCentrifugeTransaction('Update configuration', (cent) => cent.pools.setMetadata, {
    onSuccess: () => {
      setIsEditing(false)
      resetToDefault()
    },
  })

  const form = useFormik<UpdatePoolFormValues>({
    enableReinitialize: true,
    initialValues: createPoolSkeleton(pool),
    onSubmit: async (values, actions) => {
      setIsEditing(true)
      let reportUrl
      let logoUri
      let avatar
      let poolIcon
      let executiveSummary

      const pinFile = async (file: File | FileType) => {
        const pinned = await lastValueFrom(cent.metadata.pinFile(await getFileDataURI(file as File)))
        return { uri: pinned.uri, mime: (file as File).type }
      }

      // If the user has uploaded a new pool icon, the type should be File
      if (values.pool.icon && values.pool.icon instanceof File) {
        poolIcon = (await pinFile(values.pool.icon)).uri
        prefetchMetadata(poolIcon)
      }

      // If the user has uploaded a report, the type should be File
      // TODO
      if (values?.pool?.reports?.file && values?.pool?.reports?.file instanceof File) {
        reportUrl = (await pinFile(values?.pool?.reports?.file)).uri
        prefetchMetadata(reportUrl)
      }
      // If the user has uploaded a new logo, the type should be File
      if (values?.pool?.issuer?.logo && values?.pool?.issuer?.logo instanceof File) {
        logoUri = (await pinFile(values?.pool?.issuer?.logo)).uri
        prefetchMetadata(logoUri)
      }

      // If the user has uploaded a executive summary, the type should be File
      if (values?.pool?.links?.executiveSummary && values?.pool?.links?.executiveSummary instanceof File) {
        executiveSummary = (await pinFile(values?.pool?.links?.executiveSummary)).uri
        prefetchMetadata(executiveSummary)
      }

      const newPoolMetadata: PoolMetadata = {
        pool: {
          ...values.pool,
          reports: {
            ...values.pool.reports,
            file: (reportUrl || values?.pool?.reports?.file) ?? '',
          },
          issuer: {
            ...values.pool.issuer,
            logo: { uri: (logoUri || values?.pool?.issuer?.logo) ?? '' },
          },
          icon: { uri: (poolIcon || values?.pool?.icon) ?? '' },
          links: {
            ...values.pool.links,
            executiveSummary: (executiveSummary || values?.pool?.links?.executiveSummary) ?? '',
          },
        },
        pod: {
          ...values.pod,
        },
      }

      if (values.pool.poolRatings) {
        const updatedRatings = await Promise.all(
          values.pool.poolRatings.map(async (newRating, index) => {
            const existingRating = initialValues.pool.poolRatings?.[index]

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

      console.log('new metadata', newPoolMetadata)
      return

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
                      const selectedPool = pools.find((pool: PoolWithMetadata) => pool.id === event.target.value)
                      form.setValues(createPoolSkeleton(selectedPool || pools[0]))
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
