import { CurrencyBalance, Perquintill, PoolMetadata, PoolMetadataInput, Rate } from '@centrifuge/centrifuge-js'
import { Button, Grid, NumberInput, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { combineLatest, switchMap } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Column, DataTable } from '../../../components/DataTable'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { PageSection } from '../../../components/PageSection'
import { formatBalance, formatPercentage } from '../../../utils/formatting'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { useConstants, usePool, usePoolMetadata } from '../../../utils/usePools'
import { TrancheInput } from '../../IssuerCreatePool/TrancheInput'
import { validate } from '../../IssuerCreatePool/validate'

type Values = Pick<PoolMetadataInput, 'epochHours' | 'epochMinutes' | 'tranches'>

type Row = Values['tranches'][0]

export const EpochAndTranches: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const [isEditing, setIsEditing] = React.useState(false)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)

  const columns: Column[] = [
    {
      align: 'left',
      header: 'Token name',
      cell: (token: Row) => (
        <Shelf gap="2" overflow="hidden">
          <Thumbnail label={token.symbolName || ''} size="small" />
          <Text variant="body2" color="textPrimary" fontWeight={600} textOverflow="ellipsis">
            {token.tokenName}
          </Text>
        </Shelf>
      ),
      flex: '3',
    },
    {
      align: 'left',
      header: 'Token symbol',
      cell: (token: Row) => token.symbolName,
      flex: '3',
    },
    {
      align: 'left',
      header: 'Min. investment',
      cell: (token: Row) => (token.minInvestment ? formatBalance(token.minInvestment, pool?.currency.symbol) : '-'),
      flex: '3',
    },
    {
      align: 'right',
      header: 'Min. protection',
      cell: (token: Row) => (token.minRiskBuffer ? formatPercentage(token.minRiskBuffer) : '-'),
      flex: '3',
    },
    {
      align: 'right',
      header: 'Fixed interest (APR)',
      cell: (token: Row) => (token.interestRate ? formatPercentage(token.interestRate) : '-'),
      flex: '3',
    },
  ]

  const tranches = React.useMemo(
    () =>
      pool?.tranches.map((tranche) => {
        const row: Row = {
          minRiskBuffer: tranche.minRiskBuffer?.toPercent().toNumber() ?? '',
          interestRate: tranche.interestRatePerSec?.toAprPercent().toNumber() ?? '',
          tokenName: metadata?.tranches?.[tranche.id]?.name || '',
          symbolName: metadata?.tranches?.[tranche.id]?.symbol || '',
          minInvestment: new CurrencyBalance(
            metadata?.tranches?.[tranche.id]?.minInitialInvestment ?? 0,
            pool?.currency.decimals
          ).toFloat(),
        }
        return row
      }) ?? [],
    [pool, metadata]
  )

  const consts = useConstants()

  const epochHours = Math.floor((pool?.parameters.minEpochTime ?? 0) / 3600)
  const epochMinutes = Math.floor(((pool?.parameters.minEpochTime ?? 0) / 60) % 60)
  const initialValues: Values = React.useMemo(() => {
    return {
      epochHours,
      epochMinutes,
      tranches,
    }
  }, [epochHours, epochMinutes, tranches])

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update configuration',
    (cent) => (args: [poolId: string, metadata: any, updates: any], options) => {
      const [poolId, metadata, updates] = args
      return combineLatest([
        cent.getApi(),
        cent.pools.setMetadata([poolId, metadata], { batch: true }),
        cent.pools.updatePool([poolId, updates], { batch: true }),
      ]).pipe(
        switchMap(([api, setMetadataSubmittable, updatePoolSubmittable]) => {
          return cent.wrapSignAndSend(
            api,
            api.tx.utility.batchAll([setMetadataSubmittable, updatePoolSubmittable]),
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

  const form = useFormik({
    initialValues,
    onSubmit: async (values, actions) => {
      if (!hasChanges) {
        setIsEditing(false)
        actions.setSubmitting(false)
        return
      }

      const oldMetadata = metadata as PoolMetadata
      const newPoolMetadata: PoolMetadata = {
        ...oldMetadata,
        tranches: Object.fromEntries(
          Object.entries(oldMetadata.tranches).map(([id, t], i) => [
            id,
            {
              ...t,
              minInitialInvestment: CurrencyBalance.fromFloat(
                values.tranches[i].minInvestment,
                pool.currency.decimals
              ).toString(),
            },
          ])
        ),
      }

      const epochSeconds = ((values.epochHours as number) * 60 + (values.epochMinutes as number)) * 60

      // tranches must be reversed (most junior is the first in the UI but the last in the API)
      const nonJuniorTranches = values.tranches.slice(1)
      const tranches = [
        {}, // most junior tranche
        ...nonJuniorTranches.map(
          (tranche) => (
            console.log(
              'Perquintill.fromPercent(tranche.minRiskBuffer)',
              Perquintill.fromPercent(tranche.minRiskBuffer)
            ),
            {
              interestRatePerSec: Rate.fromAprPercent(tranche.interestRate),
              minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer),
            }
          )
        ),
      ]
      execute([poolId, newPoolMetadata, { minEpochTime: epochSeconds, tranches }])
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  React.useEffect(() => {
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const hasChanges = Object.entries(form.values).some(([k, v]) => (initialValues as any)[k] !== v)

  const delay = consts?.minUpdateDelay ? consts.minUpdateDelay / (60 * 60 * 24) : null

  const trancheData = [...tranches].reverse()

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Epoch and tranches"
          subtitle={
            delay
              ? `A change Takes ${
                  delay < 0.5 ? `${Math.ceil(delay / 24)} hours` : `${Math.round(delay)} days`
                } to take effect`
              : undefined
          }
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  small
                  loading={isLoading || form.isSubmitting}
                  loadingMessage={isLoading || form.isSubmitting ? 'Pending...' : undefined}
                  key="done"
                  disabled={!hasChanges}
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
          <Stack gap={4}>
            <Stack gap={2}>
              <Text variant="heading3">Epoch</Text>
              {isEditing ? (
                <Grid columns={[1, 2, 2]} equalColumns gap={2} rowGap={3}>
                  <FieldWithErrorMessage
                    validate={validate.epochHours}
                    name="epochHours"
                    as={NumberInput}
                    label="Epoch hours*"
                    maxLength={2}
                    rightElement="hrs"
                  />
                  <FieldWithErrorMessage
                    validate={validate.epochMinutes}
                    name="epochMinutes"
                    as={NumberInput}
                    label="Epoch minutes*"
                    maxLength={2}
                    rightElement="min"
                  />
                </Grid>
              ) : (
                <LabelValueStack
                  label="Minimum epoch duration"
                  value={
                    epochHours === 0 ? `${epochMinutes} minutes` : `${epochHours} hours and ${epochMinutes} minutes`
                  }
                />
              )}
            </Stack>
            <Stack gap={2}>
              <Text variant="heading3">Tranches</Text>

              {isEditing ? (
                <TrancheInput currency={pool?.currency.symbol} isUpdating />
              ) : (
                <DataTable data={trancheData} columns={columns} />
              )}
            </Stack>
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
