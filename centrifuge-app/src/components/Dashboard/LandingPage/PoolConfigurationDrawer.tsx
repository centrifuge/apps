import { CurrencyMetadata, Perquintill, PoolMetadata, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Accordion, Box, Button, Divider, Drawer, Select, Stack, Text } from '@centrifuge/fabric'
import { Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { combineLatest, of, switchMap } from 'rxjs'
import { pinFile } from '../../../../src/pages/IssuerCreatePool/utils'
import { PoolAnalysisSection } from '../../../pages/IssuerCreatePool/PoolAnalysisSection'
import { PoolRatingsSection } from '../../../pages/IssuerCreatePool/PoolRatings'
import { ServiceProvidersSection } from '../../../pages/IssuerCreatePool/ServiceProvidersSection'
import { TranchesSection } from '../../../pages/IssuerCreatePool/TranchesSection'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { usePoolAdmin, useSuitableAccounts } from '../../../utils/usePermissions'
import { useDebugFlags } from '../../DebugFlags'
import { LoadBoundary } from '../../LoadBoundary'
import { Spinner } from '../../Spinner'
import { PoolWithMetadata } from '../utils'
import { AssetCsvUpload } from './AssetsCsvUpload'
import { DebugPoolConfig } from './DebugPoolConfig'
import { IssuerDetailsSection } from './IssuerDetailsSection'
import { PoolDescriptionSection } from './PoolDescriptionSection'

type PoolConfigurationDrawerProps = {
  open: boolean
  setOpen: (open: boolean) => void
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
    minInvestment: number
    minRiskBuffer: number | null
    interestRate: number | null
    weightedAverageMaturity: number | null
  }[]
  holdings: {
    headers: string[]
    data: {
      [key: string]: string | number
    }[]
  }
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
        minInvestment: Number(trancheMeta?.minInitialInvestment ?? 0),
        weightedAverageMaturity: trancheMeta?.weightedAverageMaturity ?? null,
        apy: trancheMeta?.apy || 'Target',
        apyPercentage: trancheMeta?.apyPercentage ?? null,
        interestRate:
          tranche.index !== 0 && tranche.interestRatePerSec
            ? tranche.interestRatePerSec?.toAprPercent().toNumber()
            : null,
      }
    }),
    holdings: pool.meta?.holdings || { headers: [], data: [] },
  }
}

export function PoolConfigurationDrawer({ open, setOpen }: PoolConfigurationDrawerProps) {
  const cent = useCentrifuge()
  const { editPoolConfig } = useDebugFlags()
  const { poolsWithMetadata, selectedPoolsWithMetadata } = useSelectedPools()
  const [pool, setPool] = useState<PoolWithMetadata>(selectedPoolsWithMetadata[0])

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
    }
  )

  const initialValues = useMemo(() => createPoolValues(pool), [pool])

  const form = useFormik<UpdatePoolFormValues>({
    enableReinitialize: true,
    initialValues,
    validateOnBlur: true,
    validate: (values) => {
      let errors: FormikErrors<any> = {}
      const tokenNames = new Set<string>()
      const commonTokenSymbolStart = values.tranches[0].symbolName.slice(0, 3)
      const tokenSymbols = new Set<string>()
      let prevInterest = Infinity
      let prevRiskBuffer = 0

      const juniorInterestRate =
        values.tranches[0].apyPercentage !== null ? parseFloat(values.tranches[0].apyPercentage.toString()) : 0

      if (values.pool.issuer.categories.length > 1) {
        values.pool.issuer.categories.forEach((category, i) => {
          if (category.type === '') {
            errors = setIn(errors, `pool.issuer.categories.${i}.type`, 'Field is required')
          }
          if (category.value === '') {
            errors = setIn(errors, `pool.issuer.categories.${i}.value`, 'Field is required')
          }
          if (category.type === 'other' && category.customType === '') {
            errors = setIn(errors, `pool.issuer.categories.${i}.customType`, 'Field is required')
          }
        })
      }

      if (values.pool?.poolRatings?.length && values.pool?.poolRatings?.length > 1) {
        values.pool.poolRatings?.forEach((rating, i) => {
          if (rating.agency === '') {
            errors = setIn(errors, `pool.poolRatings.${i}.agency`, 'Field is required')
          }
          if (rating.value === '') {
            errors = setIn(errors, `pool.poolRatings.${i}.value`, 'Field is required')
          }
          if (rating.reportUrl === '') {
            errors = setIn(errors, `pool.poolRatings.${i}.reportUrl`, 'Field is required')
          }
          if (rating.reportFile === null) {
            errors = setIn(errors, `pool.poolRatings.${i}.reportFile`, 'Field is required')
          }
        })
      }

      values.tranches.forEach((t, i) => {
        if (tokenNames.has(t.tokenName)) {
          errors = setIn(errors, `tranches.${i}.tokenName`, 'Tranche names must be unique')
        }
        tokenNames.add(t.tokenName)

        // matches any character thats not alphanumeric
        if (/[^a-z^A-Z^0-9^-]+/.test(t.symbolName)) {
          errors = setIn(errors, `tranches.${i}.symbolName`, 'Invalid character detected')
        }

        if (tokenSymbols.has(t.symbolName)) {
          errors = setIn(errors, `tranches.${i}.symbolName`, 'Token symbols must be unique')
        }
        tokenSymbols.add(t.symbolName)

        if (t.symbolName.slice(0, 3) !== commonTokenSymbolStart) {
          errors = setIn(errors, `tranches.${i}.symbolName`, 'Token symbols must all start with the same 3 characters')
        }

        if (i > 0 && t.interestRate) {
          if (t.interestRate > juniorInterestRate) {
            errors = setIn(
              errors,
              `tranches.${i}.interestRate`,
              "Interest rate can't be higher than the junior tranche's target APY"
            )
          }
          if (t.interestRate > prevInterest) {
            errors = setIn(errors, `tranches.${i}.interestRate`, "Can't be higher than a more junior tranche")
          }
          prevInterest = t.interestRate
        }

        if (t.minRiskBuffer) {
          if (t.minRiskBuffer < prevRiskBuffer) {
            errors = setIn(errors, `tranches.${i}.minRiskBuffer`, "Can't be lower than a more junior tranche")
          }
          prevRiskBuffer = t.minRiskBuffer
        }
      })

      return errors
    },
    onSubmit: async (values, actions) => {
      let logoUri
      let poolIcon
      let executiveSummary

      if (values.pool.icon instanceof File) {
        poolIcon = await pinFile(cent, values.pool.icon)
      }

      if (values?.pool?.issuer?.logo instanceof File) {
        logoUri = await pinFile(cent, values?.pool?.issuer?.logo)
      }

      if (values?.pool?.links?.executiveSummary && values?.pool?.links?.executiveSummary instanceof File) {
        executiveSummary = await pinFile(cent, values?.pool?.links?.executiveSummary)
      }

      const newPoolMetadata: PoolMetadata = {
        ...pool.meta,
        pool: {
          ...pool.meta.pool,
          expenseRatio: values.pool.expenseRatio,
        },
        holdings: values.holdings,
        tranches: values.tranches.reduce((acc, tranche) => {
          acc[tranche.id] = {
            minInitialInvestment: tranche.minInvestment.toString(),
            apy: tranche.apy,
            apyPercentage: tranche.apyPercentage,
            weightedAverageMaturity: tranche.weightedAverageMaturity,
          }
          return acc
        }, {} as Record<string, { minInitialInvestment: string; apy: string; apyPercentage: number | null; weightedAverageMaturity: number | null }>),
      }

      // Pool report (pool analysis in UI)
      if (values.pool.report && values?.pool?.report?.author?.avatar instanceof File) {
        const avatar = await pinFile(cent, values?.pool?.report?.author?.avatar)
        newPoolMetadata.pool.report = {
          ...values.pool.report,
          author: {
            ...values.pool.report.author,
            avatar,
          },
        }
      }

      // Issuer logo
      if (logoUri) {
        newPoolMetadata.pool.issuer = {
          ...pool.meta.pool.issuer,
          logo: logoUri,
        }
      }

      // Executive summary (inside links)
      if (executiveSummary) {
        newPoolMetadata.pool.links.executiveSummary = executiveSummary
      }

      // Pool icon
      if (poolIcon) {
        newPoolMetadata.pool.icon = poolIcon
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
                const pinnedFile = await pinFile(cent, newReportFile as any)
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

      const hasTrancheChanges = initialValues.tranches.some((t1, i) => {
        const t2 = values.tranches[i]
        return (
          t1.tokenName !== t2.tokenName ||
          t1.symbolName !== t2.symbolName ||
          t1.interestRate !== t2.interestRate ||
          t1.minRiskBuffer !== t2.minRiskBuffer
        )
      })

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
          minInitialInvestment: tranche.minInvestment,
          apy: tranche.apy.toString(),
          apyPercentage: tranche.apyPercentage,
          weightedAverageMaturity: tranche.weightedAverageMaturity,
        })),
      ]

      console.log('newPoolMetadata', newPoolMetadata)

      execute([values.id, newPoolMetadata, hasTrancheChanges ? tranches : undefined], { account })
      actions.setSubmitting(false)
    },
  })

  // form variables
  const isPoolAdmin = !!usePoolAdmin(pool.id)
  const [account] = useSuitableAccounts({ poolId: pool.id, poolRole: ['PoolAdmin'] })

  const resetToDefault = () => {
    form.resetForm()
    setOpen(false)
    setPool(selectedPoolsWithMetadata[0])
  }

  if (!selectedPoolsWithMetadata.length || !pool) return

  return (
    <LoadBoundary>
      <Drawer isOpen={open} onClose={resetToDefault} title="Edit configuration" width="33%">
        <Divider color="backgroundSecondary" />
        <Select
          label="Select pool"
          options={poolsWithMetadata.map((pool) => ({
            label: pool.meta?.pool?.name,
            value: pool.id,
          }))}
          value={pool.id}
          onChange={(event) => {
            const selectedPool = poolsWithMetadata.find((pool: PoolWithMetadata) => pool.id === event.target.value)
            if (selectedPool) {
              setPool(selectedPool)
            }
          }}
        />
        <FormikProvider value={form}>
          {pool.id !== form.values.id ? (
            <Spinner />
          ) : (
            <Form noValidate>
              <Stack mb={3}>
                {!isPoolAdmin && (
                  <Box mt={2}>
                    <Text variant="body2" color="textSecondary">
                      Only pool admins can edit configuration.
                    </Text>
                  </Box>
                )}
                {isPoolAdmin && (
                  <Accordion
                    items={[
                      {
                        title: (
                          <Box py={2}>
                            <Text variant="heading3">Pool description</Text>
                          </Box>
                        ),
                        body: <PoolDescriptionSection isUpdating />,
                      },
                      {
                        title: (
                          <Box py={2}>
                            <Text variant="heading3">Issuer details</Text>
                          </Box>
                        ),
                        body: <IssuerDetailsSection isUpdating />,
                      },
                      {
                        title: (
                          <Box py={2}>
                            <Text variant="heading3">Service providers</Text>
                          </Box>
                        ),
                        body: <ServiceProvidersSection isUpdating />,
                      },
                      {
                        title: (
                          <Box py={2}>
                            <Text variant="heading3">Pool ratings</Text>
                          </Box>
                        ),
                        body: <PoolRatingsSection isUpdating />,
                      },
                      {
                        title: (
                          <Box py={2}>
                            <Text variant="heading3">Pool analysis</Text>
                          </Box>
                        ),
                        body: <PoolAnalysisSection isUpdating />,
                      },
                      {
                        title: (
                          <Box py={2}>
                            <Text variant="heading3">Tranche structure</Text>
                          </Box>
                        ),
                        body: <TranchesSection isUpdating />,
                      },
                      {
                        title: (
                          <Box py={2}>
                            <Text variant="heading3">Holdings CSV</Text>
                          </Box>
                        ),
                        body: <AssetCsvUpload />,
                      },
                    ]}
                  />
                )}
              </Stack>
              <Stack gap={2} display="flex" justifyContent="flex-end" flexDirection="column">
                <Button loading={isLoading} type="submit" disabled={!form.dirty || !form.isValid}>
                  Update
                </Button>
                <Button variant="inverted" onClick={resetToDefault}>
                  Cancel
                </Button>
              </Stack>
            </Form>
          )}
        </FormikProvider>
        {isPoolAdmin && editPoolConfig && <DebugPoolConfig poolId={pool.id} />}
      </Drawer>
    </LoadBoundary>
  )
}
