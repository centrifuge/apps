import { ActiveLoan, CreatedLoan, CurrencyBalance, ExternalLoan, addressToHex } from '@centrifuge/centrifuge-js'
import {
  useAddress,
  useCentrifugeApi,
  useCentrifugeQuery,
  useCentrifugeTransaction,
} from '@centrifuge/centrifuge-react'
import { Button, CurrencyInput, Drawer, IconDownload, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import { Field, FieldProps, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { map } from 'rxjs'
import { ButtonGroup } from '../../components/ButtonGroup'
import { DataCol, DataRow, DataTable } from '../../components/DataTable'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { AssetName } from '../../components/LoanList'
import { isSubstrateAddress } from '../../utils/address'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { usePool, usePoolMetadata, usePools } from '../../utils/usePools'
import { settlementPrice } from '../../utils/validation'
import { isCashLoan, isExternalLoan } from '../Loan/utils'

type FormValues = {
  feed: {
    formIndex: number
    id: string
    oldValue: number
    value: number | ''
    Isin: string
    quantity: number
    maturity: string
  }[]
  closeEpoch: boolean
}
type Row = FormValues['feed'][0] | ActiveLoan | CreatedLoan

export function NavManagementAssetTable({ poolId }: { poolId: string }) {
  const allowedPools = usePoolsForWhichAccountIsFeeder()
  const isFeeder = !!allowedPools?.find((p) => p.id === poolId)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isConfirming, setIsConfirming] = React.useState(false)

  const pool = usePool(poolId, false)
  const [allLoans] = useCentrifugeQuery(['loans', poolId], (cent) => cent.pools.getLoans([poolId]), {
    enabled: !!poolId && !!pool,
  })

  const externalLoans = React.useMemo(
    () => (allLoans?.filter((l) => isExternalLoan(l) && l.status !== 'Closed') as ExternalLoan[]) ?? [],
    [allLoans]
  )
  const cashLoans =
    (allLoans?.filter((l) => isCashLoan(l) && l.status !== 'Closed') as (CreatedLoan | ActiveLoan)[]) ?? []
  const api = useCentrifugeApi()

  const { execute, isLoading } = useCentrifugeTransaction(
    'Set oracle prices',
    (cent) => (args: [values: FormValues], options) => {
      const [values] = args
      const batch = [
        ...values.feed
          .filter((f) => typeof f.value === 'number' && !Number.isNaN(f.value))
          .map((f) => api.tx.oraclePriceFeed.feed({ Isin: f.Isin }, CurrencyBalance.fromFloat(f.value, 18))),
        api.tx.oraclePriceCollection.updateCollection(poolId),
        api.tx.loans.updatePortfolioValuation(poolId),
      ]
      if (values.closeEpoch) {
        batch.push(api.tx.poolSystem.closeEpoch(poolId))
      }
      const tx = api.tx.utility.batchAll(batch)
      return cent.wrapSignAndSend(api, tx, options)
    }
  )

  const initialValues = React.useMemo(
    () => ({
      feed:
        externalLoans?.map((l, i) => {
          let latestOraclePrice = l.pricing.oracle[0]
          l.pricing.oracle.forEach((price) => {
            if (price.timestamp > latestOraclePrice.timestamp) {
              latestOraclePrice = price
            }
          })
          return {
            formIndex: i,
            id: l.id,
            oldValue: latestOraclePrice.value.toFloat(),
            value: '' as const,
            Isin: l.pricing.Isin,
            quantity: l.pricing.outstandingQuantity.toFloat(),
            maturity: formatDate(l.pricing.maturityDate),
          }
        }) ?? [],
      closeEpoch: false,
    }),
    [externalLoans]
  )

  const form = useFormik<FormValues>({
    initialValues,
    onSubmit(values, actions) {
      execute([values])
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  const newNavExternal = form.values.feed.reduce((acc, cur) => acc + cur.quantity * (cur.value || cur.oldValue), 0)
  const newNavCash = cashLoans.reduce((acc, cur) => acc + cur.outstandingDebt.toFloat(), 0)
  const newNav = newNavExternal + newNavCash

  const columns = [
    {
      align: 'left',
      header: 'Asset',
      cell: (row: Row) =>
        'oldValue' in row ? (
          <Shelf gap={1} height={40}>
            <Thumbnail type="asset" label={row.id} />
            <Text variant="body2" fontWeight={600}>
              {row.Isin}
            </Text>
          </Shelf>
        ) : (
          <Shelf height={40}>
            <AssetName loan={row} />
          </Shelf>
        ),
    },
    {
      align: 'left',
      header: 'Maturity date',
      cell: (row: Row) => ('oldValue' in row ? row.maturity : ''),
    },
    {
      align: 'right',
      header: 'Quantity',
      cell: (row: Row) => formatBalance('oldValue' in row ? row.quantity : row.outstandingDebt),
    },
    {
      align: 'right',
      header: 'Asset price',
      cell: (row: Row) => formatBalance('oldValue' in row ? row.oldValue : 1, pool?.currency.symbol, 8),
    },
    {
      align: 'right',
      header: 'New price',
      cell: (row: Row) =>
        'oldValue' in row
          ? (console.log('row.formIndex', row.formIndex),
            (
              <Field name={`feed.${row.formIndex}.value`} validate={settlementPrice()}>
                {({ field, meta, form }: FieldProps) => (
                  <CurrencyInput
                    {...field}
                    placeholder={row.oldValue.toString()}
                    errorMessage={meta.touched ? meta.error : undefined}
                    currency={pool?.currency.symbol}
                    onChange={(value) => form.setFieldValue(`feed.${row.formIndex}.value`, value)}
                  />
                )}
              </Field>
            ))
          : '',
    },
    {
      align: 'right',
      header: 'Value',
      cell: (row: Row) =>
        'oldValue' in row
          ? formatBalance(row.quantity * (row.value || row.oldValue), pool?.currency.symbol)
          : formatBalance(row.outstandingDebt, pool?.currency.symbol),
    },
  ]

  if (!isEditing) {
    columns.splice(4, 1)
  }

  return (
    <>
      <FormikProvider value={form}>
        <Drawer isOpen={isConfirming} onClose={() => setIsConfirming(false)}>
          <ButtonGroup>
            <Button
              onClick={() => {
                form.submitForm()
                setIsConfirming(false)
              }}
            >
              Confirm NAV
            </Button>
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
          </ButtonGroup>
        </Drawer>
        <LayoutSection
          title="Assets"
          pt={5}
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small" key="editing">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  small
                  onClick={() => setIsConfirming(true)}
                  loading={isLoading || form.isSubmitting}
                  loadingMessage={isLoading ? 'Pending...' : undefined}
                  disabled={!isFeeder}
                >
                  Done
                </Button>
              </ButtonGroup>
            ) : (
              <ButtonGroup variant="small" key="edit">
                <Button variant="tertiary" small icon={IconDownload}>
                  Download
                </Button>
                <Button onClick={() => setIsEditing(true)} small>
                  Edit
                </Button>
              </ButtonGroup>
            )
          }
        >
          <DataTable
            data={[...cashLoans, ...form.values.feed]}
            columns={columns}
            footer={
              <DataRow>
                <DataCol align="left">
                  <Text color="accentPrimary" variant="body2">
                    Total
                  </Text>
                </DataCol>
                <DataCol />
                <DataCol />
                <DataCol />
                {isEditing && <DataCol />}
                <DataCol>
                  <Text color="accentPrimary" variant="body2">
                    {formatBalance(newNav, pool?.currency.symbol)}
                  </Text>
                </DataCol>
              </DataRow>
            }
          />
        </LayoutSection>
      </FormikProvider>
    </>
  )
}

function PoolName({ poolId }: { poolId: string }) {
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  return metadata?.pool?.name || poolId
}

function usePoolFeeders() {
  const api = useCentrifugeApi()
  const [storedInfo] = useCentrifugeQuery(['oracleCollectionInfos'], () =>
    api.query.oraclePriceCollection.collectionInfo.entries().pipe(
      map((data) => {
        const poolsByFeeder: Record<string, string[]> = {}
        const feedersByPool: Record<string, { minFeeders: number; valueLifetime: number; feeders: string[] }> = {}
        data.forEach(([keys, value]) => {
          const poolId = (keys.toHuman() as string[])[0].replace(/\D/g, '')
          const info = value.toPrimitive() as any
          const feeders = info.feeders
            .filter((f: any) => !!f.system.signed)
            .map((f: any) => addressToHex(f.system.signed)) as string[]

          feeders.forEach((feeder) => {
            if (poolsByFeeder[feeder]) {
              poolsByFeeder[feeder].push(poolId)
            } else {
              poolsByFeeder[feeder] = [poolId]
            }
          })

          feedersByPool[poolId] = {
            valueLifetime: info.valueLifetime as number,
            minFeeders: info.minFeeders as number,
            feeders,
          }
        })

        return {
          poolsByFeeder,
          feedersByPool,
        }
      })
    )
  )

  return {
    poolsByFeeder: storedInfo?.poolsByFeeder ?? {},
    feedersByPool: storedInfo?.feedersByPool ?? {},
  }
}

export function usePoolsForWhichAccountIsFeeder(address?: string) {
  const defaultAddress = useAddress('substrate')
  address ??= defaultAddress
  const { poolsByFeeder } = usePoolFeeders()
  const poolIds = (address && isSubstrateAddress(address) && poolsByFeeder[address]) || []
  return usePools()?.filter((p) => poolIds.includes(p.id))
}
