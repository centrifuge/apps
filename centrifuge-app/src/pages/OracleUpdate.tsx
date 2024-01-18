import { addressToHex, CurrencyBalance, ExternalLoan } from '@centrifuge/centrifuge-js'
import {
  useAddress,
  useCentrifugeApi,
  useCentrifugeQuery,
  useCentrifugeTransaction,
} from '@centrifuge/centrifuge-react'
import { Box, Button, Checkbox, CurrencyInput, Select, Shelf } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { map } from 'rxjs'
import { DataTable } from '../components/DataTable'
import { LayoutBase } from '../components/LayoutBase'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { PageSection } from '../components/PageSection'
import { usePool, usePoolMetadata, usePools } from '../utils/usePools'
import { settlementPrice } from '../utils/validation'
import { isExternalLoan } from './Loan/utils'

export default function OracleUpdatePage() {
  return (
    <LayoutBase>
      <OracleUpdate />
    </LayoutBase>
  )
}

type FormValues = {
  feed: { id: string; value: number | ''; Isin: string }[]
  closeEpoch: boolean
}
type FeedItem = FormValues['feed'][0]

function OracleUpdate() {
  const address = useAddress('substrate')
  const [poolId, setPoolId] = React.useState('')
  const { poolsByFeeder } = usePoolFeeders()
  const pools = usePools()
  const pool = usePool(poolId, false)
  const [allLoans] = useCentrifugeQuery(['loans', poolId], (cent) => cent.pools.getLoans([poolId]), {
    enabled: !!poolId && !!pool,
  })
  const loans = React.useMemo(
    () => (allLoans?.filter((l) => isExternalLoan(l) && l.status !== 'Closed') as ExternalLoan[]) || undefined,
    [allLoans]
  )
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
        loans?.map((l) => {
          let latestOraclePrice = l.pricing.oracle[0]
          l.pricing.oracle.forEach((price) => {
            if (price.timestamp > latestOraclePrice.timestamp) {
              latestOraclePrice = price
            }
          })
          return { id: l.id, value: latestOraclePrice.value.toFloat(), Isin: l.pricing.Isin }
        }) ?? [],
      closeEpoch: false,
    }),
    [loans]
  )

  const form = useFormik<FormValues>({
    initialValues,
    onSubmit(values, actions) {
      execute([values])
      actions.setSubmitting(false)
    },
  })

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

  const allowedPoolIds = address ? poolsByFeeder[address] : undefined

  return (
    <FormikProvider value={form}>
      <Form>
        <LayoutSection title="Update oracle values" pt={5}>
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
            data={form.values.feed}
            columns={[
              {
                align: 'left',
                header: 'Loan id',
                width: '80px',
                cell: (row: FeedItem) => row.id,
              },
              {
                align: 'left',
                header: 'Isin',
                cell: (row: FeedItem) => row.Isin,
              },
              {
                align: 'left',
                header: 'Price',
                cell: (row: FeedItem, index) => (
                  <Field name={`feed.${index}.value`} validate={settlementPrice()}>
                    {({ field, meta, form }: FieldProps) => (
                      <CurrencyInput
                        {...field}
                        errorMessage={meta.touched ? meta.error : undefined}
                        currency={pool?.currency.symbol}
                        onChange={(value) => form.setFieldValue(`feed.${index}.value`, value)}
                      />
                    )}
                  </Field>
                ),
              },
            ]}
          />
          <Field type="checkbox" name="closeEpoch" as={Checkbox} label="Close epoch" />
        </LayoutSection>
        <Box position="sticky" bottom={0} backgroundColor="backgroundPage" pt={5}>
          <PageSection>
            <Shelf gap={1} justifyContent="end">
              <Button type="submit" small loading={isLoading || form.isSubmitting}>
                Update
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
