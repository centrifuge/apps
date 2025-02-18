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
import { Accordion, Box, Button, Divider, Drawer, Grid, Select, Text } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { combineLatest, lastValueFrom, of, switchMap } from 'rxjs'
import { LoadBoundary } from '../../../../src/components/LoadBoundary'
import { Spinner } from '../../../../src/components/Spinner'
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
    apy: string
    apyPercentage: number | null
    minInvestment: string
    minRiskBuffer: number | null
    interestRate: number | null
  }[]
}

const createPoolValues = (pool: PoolWithMetadata) => {
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
        minRiskBuffer: tranche.minRiskBuffer?.toPercent().toNumber() ?? null,
        minInvestment: trancheMeta?.minInitialInvestment,
        apy: trancheMeta?.apy,
        apyPercentage: trancheMeta?.apyPercentage ?? null,
        interestRate:
          tranche.index !== 0 && tranche.interestRatePerSec
            ? tranche.interestRatePerSec?.toAprPercent().toNumber()
            : null,
      }
    }),
  }
}

export function PoolConfigurationDrawer({ open, setOpen, pools }: PoolConfigurationDrawerProps) {
  const cent = useCentrifuge()
  const prefetchMetadata = usePrefetchMetadata()
  const [isEditing, setIsEditing] = useState(false)
  const [pool, setPool] = useState<PoolWithMetadata>(pools[0])

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update configuration',
    (cent) => (args: [poolId: string, metadata: any, updates: any], options) => {
      const [poolId, metadata, updates] = args
      return combineLatest([
        cent.getApi(),
        metadata ? cent.pools.setMetadata([poolId, metadata], { batch: true }) : of(null),
        updates ? cent.pools.updatePool([poolId, updates], { batch: true }) : of(null),
      ]).pipe(
        switchMap(([api, setMetadataSubmittable, updatePoolSubmittable]) => {
          return cent.wrapSignAndSend(
            api,
            updatePoolSubmittable && setMetadataSubmittable
              ? api.tx.utility.batchAll([setMetadataSubmittable, updatePoolSubmittable])
              : setMetadataSubmittable || updatePoolSubmittable,
            options
          )
        })
      )
    },

    {
      onSuccess: () => {
        setIsEditing(false)
      },
    }
  )

  const form = useFormik<UpdatePoolFormValues>({
    enableReinitialize: true,
    initialValues: createPoolValues(pool),
    onSubmit: async (values, actions) => {
      setIsEditing(true)
      let logoUri
      let poolIcon
      let executiveSummary

      // Pin files ( poolIcon, issuerLogo, executiveSummary)

      const pinFile = async (file: File | FileType) => {
        const pinned = await lastValueFrom(cent.metadata.pinFile(await getFileDataURI(file as File)))
        return { uri: pinned.uri, mime: (file as File).type }
      }

      if (values.pool.icon instanceof File) {
        poolIcon = (await pinFile(values.pool.icon)).uri
        prefetchMetadata(poolIcon)
      }

      if (values?.pool?.issuer?.logo instanceof File) {
        logoUri = (await pinFile(values?.pool?.issuer?.logo)).uri
        prefetchMetadata(logoUri)
      }

      if (values?.pool?.links?.executiveSummary && values?.pool?.links?.executiveSummary instanceof File) {
        executiveSummary = (await pinFile(values?.pool?.links?.executiveSummary)).uri
        prefetchMetadata(executiveSummary)
      }

      console.log(values)

      const newPoolMetadata: PoolMetadata = {
        pool: {
          ...values.pool,
        },
        pod: {
          ...values.pod,
        },
        tranches: values.tranches.reduce((acc, tranche) => {
          acc[tranche.id] = {
            minInitialInvestment: CurrencyBalance.fromFloat(tranche.minInvestment, values.currency.decimals).toString(),
            apy: tranche.apy,
            apyPercentage: tranche.apyPercentage,
          }
          return acc
        }, {} as Record<string, { minInitialInvestment: string; apy: string; apyPercentage: number | null }>),
      }

      // Pool report (pool analysis in UI)
      if (values.pool.report && values?.pool?.report?.author?.avatar instanceof File) {
        const avatar = (await pinFile(values?.pool?.report?.author?.avatar)).uri
        newPoolMetadata.pool.report = {
          ...values.pool.report,
          author: {
            ...values.pool.report.author,
            avatar: { uri: avatar, mime: 'image/png' },
          },
        }
      }

      // Issuer logo
      if (logoUri) {
        newPoolMetadata.pool.issuer = {
          ...values.pool.issuer,
          logo: { uri: logoUri, mime: 'image/png' },
        }
      }

      // Executive summary (inside links)
      if (executiveSummary) {
        newPoolMetadata.pool.links.executiveSummary = { uri: executiveSummary, mime: 'application/pdf' }
      }

      // Pool icon
      if (poolIcon) {
        newPoolMetadata.pool.icon = { uri: poolIcon, mime: 'image/svg' }
      }

      // Pool ratings
      if (values.pool.poolRatings) {
        const updatedRatings = await Promise.all(
          values.pool.poolRatings.map(async (newRating, index) => {
            const existingRating = form.initialValues.pool.poolRatings?.[index]

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

      // Tranches
      const nonJuniorTranches = values.tranches.slice(1)
      const tranches = [
        {
          tokenName: values.tranches[0].tokenName,
          tokenSymbol: values.tranches[0].symbolName,
          apy: values.tranches[0].apy.toString(),
          apyPercentage: values.tranches[0].apyPercentage,
          minInitialInvestment: values.tranches[0].minInvestment,
        }, // most junior tranche
        ...nonJuniorTranches.map((tranche) => ({
          interestRatePerSec: tranche.interestRate ? Rate.fromAprPercent(tranche.interestRate) : null,
          minRiskBuffer: tranche.minRiskBuffer ? Perquintill.fromPercent(tranche.minRiskBuffer) : null,
          tokenName: tranche.tokenName,
          tokenSymbol: tranche.symbolName,
        })),
      ]

      return

      execute([values.id, newPoolMetadata, tranches], { account })
      actions.setSubmitting(false)
    },
  })

  // Force reinitialize Formik when the pool changes this is so we can use the formik (dirty) to enable/disable the update button.
  useEffect(() => {
    form.resetForm()
  }, [pool])

  // form variables
  const isPoolAdmin = !!usePoolAdmin(pool.id)
  const [account] = useSuitableAccounts({ poolId: pool.id, poolRole: ['PoolAdmin'] })

  const resetToDefault = () => {
    form.resetForm()
    setOpen(false)
    setIsEditing(false)
    setPool(pools[0])
  }

  if (!pools.length || !pool) return

  return (
    <LoadBoundary>
      <Drawer isOpen={open} onClose={resetToDefault} title="Edit configuration">
        <Divider color="backgroundSecondary" />
        <FormikProvider value={form}>
          {pool.id !== form.values.id ? (
            <Spinner />
          ) : (
            <Form noValidate>
              <Box px={1}>
                <Select
                  label="Select pool"
                  options={pools.map((pool) => ({
                    label: pool.meta?.pool?.name,
                    value: pool.id,
                  }))}
                  value={pool.id}
                  onChange={(event) => {
                    const selectedPool = pools.find((pool: PoolWithMetadata) => pool.id === event.target.value)
                    if (selectedPool) {
                      setPool(selectedPool)
                    }
                  }}
                />
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
              {!isPoolAdmin && (
                <Box mt={2} padding={1}>
                  <Text variant="heading4" color="statusCritical">
                    Only pool admins can edit the pool
                  </Text>
                </Box>
              )}
              <Grid
                gap={2}
                display="flex"
                justifyContent="flex-end"
                flexDirection="column"
                marginTop={isPoolAdmin ? '30%' : '100%'}
              >
                <Button onClick={form.submitForm} loading={isEditing || isLoading} type="submit" disabled={!form.dirty}>
                  Update
                </Button>
                <Button variant="inverted" onClick={resetToDefault}>
                  Cancel
                </Button>
              </Grid>
            </Form>
          )}
        </FormikProvider>
      </Drawer>
    </LoadBoundary>
  )
}
