import { ActiveLoan, addressToHex, CreatedLoan, CurrencyBalance, ExternalLoan } from '@centrifuge/centrifuge-js'
import {
  useAddress,
  useCentrifugeApi,
  useCentrifugeQuery,
  useCentrifugeTransaction,
} from '@centrifuge/centrifuge-react'
import { Box, Button, Checkbox, CurrencyInput, Select, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { map } from 'rxjs'
import { DataTable } from '../components/DataTable'
import { LayoutBase } from '../components/LayoutBase'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { AssetName } from '../components/LoanList'
import { PageSection } from '../components/PageSection'
import { formatBalance } from '../utils/formatting'
import { usePool, usePoolMetadata, usePools } from '../utils/usePools'
import { settlementPrice } from '../utils/validation'
import { isCashLoan, isExternalLoan } from './Loan/utils'

export default function NavManagementPage() {
  return (
    <LayoutBase>
      <NavManagement />
    </LayoutBase>
  )
}

type FormValues = {
  feed: { id: string; oldValue: number; value: number | ''; Isin: string; quantity: number }[]
  closeEpoch: boolean
}
type Row = FormValues['feed'][0] | ActiveLoan | CreatedLoan

function NavManagement() {
  const address = useAddress('substrate')
  const [poolId, setPoolId] = React.useState('')
  const { poolsByFeeder } = usePoolFeeders()
  const pools = usePools()
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
  const shouldReset = React.useRef(false)
  const api = useCentrifugeApi()

  const { execute, isLoading } = useCentrifugeTransaction(
    'Set oracle prices',
    (cent) => (args: [values: FormValues], options) => {
      const [values] = args
      const batch = [
        ...values.feed
          .filter((f) => typeof f.value === 'number' && !Number.isNaN(f.value))
          .map((f) => api.tx.oraclePriceFeed.feed({ Isin: f.Isin }, CurrencyBalance.fromFloat(f.value, 18))),
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
        externalLoans?.map((l) => {
          let latestOraclePrice = l.pricing.oracle[0]
          l.pricing.oracle.forEach((price) => {
            if (price.timestamp > latestOraclePrice.timestamp) {
              latestOraclePrice = price
            }
          })
          return {
            id: l.id,
            oldValue: latestOraclePrice.value.toFloat(),
            value: '' as const,
            Isin: l.pricing.Isin,
            quantity: l.pricing.outstandingQuantity.toFloat(),
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

  const allowedPoolIds = address ? poolsByFeeder[address] : undefined

  React.useEffect(() => {
    if (allowedPoolIds?.length === 1) setPoolId(allowedPoolIds[0])
  }, [allowedPoolIds])

  React.useEffect(() => {
    if (shouldReset.current) {
      form.resetForm()
      form.setValues(initialValues, false)
      shouldReset.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  React.useEffect(() => {
    form.resetForm()
    form.setValues(initialValues, false)
    shouldReset.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId])

  const newNavExternal = form.values.feed.reduce((acc, cur) => acc + cur.quantity * (cur.value || cur.oldValue), 0)
  const newNavCash = cashLoans.reduce((acc, cur) => acc + cur.outstandingDebt.toFloat(), 0)
  const newNav = newNavExternal + newNavCash

  return (
    <FormikProvider value={form}>
      <Form>
        <LayoutSection title="NAV management" pt={5}>
          <Select
            options={
              pools
                ?.filter((p) => allowedPoolIds?.includes(p.id))
                ?.map((p) => ({ label: <PoolName poolId={p.id} />, value: p.id })) ?? []
            }
            value={poolId}
            placeholder="Select pool"
            onChange={(e) => setPoolId(e.target.value)}
          />
          <DataTable
            data={[...form.values.feed, ...cashLoans]}
            columns={[
              {
                align: 'left',
                header: 'Asset',
                cell: (row: Row) =>
                  'oldValue' in row ? (
                    <Shelf gap={1}>
                      <Thumbnail type="asset" label={row.id} />
                      <Text variant="body2" fontWeight={600}>
                        {row.Isin}
                      </Text>
                    </Shelf>
                  ) : (
                    <AssetName loan={row} />
                  ),
              },
              {
                align: 'right',
                header: 'Quantity',
                cell: (row: Row) =>
                  'oldValue' in row
                    ? formatBalance(row.quantity)
                    : formatBalance(row.outstandingDebt, pool?.currency.symbol),
              },
              {
                align: 'right',
                header: 'Old price',
                cell: (row: Row) => ('oldValue' in row ? formatBalance(row.oldValue, pool?.currency.symbol) : ''),
              },
              {
                align: 'right',
                header: 'New price',
                cell: (row: Row, index) =>
                  'oldValue' in row ? (
                    <Field name={`feed.${index}.value`} validate={settlementPrice()}>
                      {({ field, meta, form }: FieldProps) => (
                        <CurrencyInput
                          {...field}
                          placeholder={row.oldValue.toString()}
                          errorMessage={meta.touched ? meta.error : undefined}
                          currency={pool?.currency.symbol}
                          onChange={(value) => form.setFieldValue(`feed.${index}.value`, value)}
                        />
                      )}
                    </Field>
                  ) : (
                    ''
                  ),
              },
              {
                align: 'right',
                header: 'Value',
                cell: (row: Row) =>
                  'oldValue' in row
                    ? formatBalance(row.quantity * (row.value || row.oldValue), pool?.currency.symbol)
                    : formatBalance(row.outstandingDebt, pool?.currency.symbol),
              },
            ]}
          />
          <Shelf justifyContent="end" px={2}>
            <Stack alignItems="center">
              <Text>=</Text>
              <Text>{formatBalance(newNav, pool?.currency.symbol)}</Text>
            </Stack>
          </Shelf>
        </LayoutSection>
        <Box position="sticky" bottom={0} backgroundColor="backgroundPage" pt={5}>
          <PageSection>
            <Shelf gap={2} justifyContent="end">
              <Field type="checkbox" name="closeEpoch" as={Checkbox} label="Execute orders" />
              <Button type="submit" small loading={isLoading || form.isSubmitting}>
                Confirm NAV
              </Button>
            </Shelf>
          </PageSection>
        </Box>
      </Form>
    </FormikProvider>
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
