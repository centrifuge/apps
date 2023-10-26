import { CurrencyBalance, Perquintill, PoolMetadata, PoolMetadataInput, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifugeConsts, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Grid, NumberInput, Shelf, Stack, StatusChip, Text, Thumbnail } from '@centrifuge/fabric'
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
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolChanges, usePoolMetadata } from '../../../utils/usePools'
import { TrancheInput } from '../../IssuerCreatePool/TrancheInput'
import { validate } from '../../IssuerCreatePool/validate'

type Values = Pick<PoolMetadataInput, 'epochHours' | 'epochMinutes' | 'tranches'>

type Row = Values['tranches'][0]

export function EpochAndTranches() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const [isEditing, setIsEditing] = React.useState(false)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'], proxyType: ['Borrow'] })
  const changes = usePoolChanges(poolId)

  const { execute: executeApply, isLoading: isApplyLoading } = useCentrifugeTransaction(
    'Apply pool update',
    (cent) => cent.pools.applyPoolUpdate
  )

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
      width: 'minmax(150px, 1fr)',
    },
    {
      align: 'left',
      header: 'Token symbol',
      cell: (token: Row) => token.symbolName,
      width: 'min-content',
    },
    {
      align: 'left',
      header: 'Min. investment',
      cell: (token: Row) => (token.minInvestment ? formatBalance(token.minInvestment, pool?.currency.symbol) : '-'),
      width: 'min-content',
    },
    {
      align: 'right',
      header: 'Min. subordination',
      cell: (token: Row) => (token.minRiskBuffer ? formatPercentage(token.minRiskBuffer) : '-'),
      width: 'min-content',
    },
    {
      align: 'right',
      header: 'Fixed interest (APR)',
      cell: (token: Row) => (token.interestRate ? formatPercentage(token.interestRate) : '-'),
      width: 'min-content',
    },
  ]

  const tranches = React.useMemo(
    () =>
      pool?.tranches.map((tranche) => {
        const row: Row = {
          minRiskBuffer: tranche.minRiskBuffer?.toPercent().toNumber() ?? '',
          interestRate: tranche.interestRatePerSec?.toAprPercent().toNumber() ?? '',
          tokenName: tranche.currency.name,
          symbolName: tranche.currency.symbol,
          minInvestment: new CurrencyBalance(
            metadata?.tranches?.[tranche.id]?.minInitialInvestment ?? 0,
            pool?.currency.decimals
          ).toFloat(),
        }
        return row
      }) ?? [],
    [pool, metadata]
  )

  const consts = useCentrifugeConsts()

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

      const hasTrancheChanges = initialValues.tranches.some((t1, i) => {
        const t2 = values.tranches[i]
        return (
          t1.tokenName !== t2.tokenName ||
          t1.symbolName !== t2.symbolName ||
          t1.interestRate !== t2.interestRate ||
          t1.minRiskBuffer !== t2.minRiskBuffer
        )
      })

      // tranches must be reversed (most junior is the first in the UI but the last in the API)
      const nonJuniorTranches = values.tranches.slice(1)
      const tranches = [
        {
          tokenName: values.tranches[0].tokenName,
          tokenSymbol: values.tranches[0].symbolName,
        }, // most junior tranche
        ...nonJuniorTranches.map((tranche) => ({
          interestRatePerSec: Rate.fromAprPercent(tranche.interestRate),
          minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer),
          tokenName: tranche.tokenName,
          tokenSymbol: tranche.symbolName,
        })),
      ]
      execute(
        [poolId, newPoolMetadata, { minEpochTime: epochSeconds, tranches: hasTrancheChanges ? tranches : undefined }],
        { account, forceProxyType: 'Borrow' }
      )
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

  const delay = consts.poolSystem.minUpdateDelay / (60 * 60 * 24)

  const trancheData = [...tranches].reverse()

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title={
            <Shelf gap={1}>
              Epoch and tranches{' '}
              {changes && changes.status !== 'ready' && <StatusChip status="info">Pending changes</StatusChip>}
            </Shelf>
          }
          subtitle={`Changes require ${
            delay < 0.5 ? `${Math.ceil(delay / 24)} hour(s)` : `${Math.round(delay)} day(s)`
          } and no oustanding redeem orders before they can be enabled`}
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
              <ButtonGroup>
                {changes?.status === 'ready' && (
                  <Button
                    small
                    loading={isApplyLoading}
                    disabled={!account}
                    onClick={() => executeApply([poolId], { account })}
                    key="apply"
                  >
                    Apply changes
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setIsEditing(true)} small key="edit">
                  Edit
                </Button>
              </ButtonGroup>
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
