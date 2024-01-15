import { CurrencyBalance, ExternalLoan } from '@centrifuge/centrifuge-js'
import {
  useAddress,
  useCentrifugeApi,
  useCentrifugeQuery,
  useCentrifugeTransaction,
} from '@centrifuge/centrifuge-react'
import { Box, Button, Checkbox, CurrencyInput, Select, Shelf } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { DataTable } from '../components/DataTable'
import { LayoutBase } from '../components/LayoutBase'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { PageSection } from '../components/PageSection'
import { usePool, usePoolMetadata, usePools } from '../utils/usePools'
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
  console.log('poolId', poolId)
  const pools = usePools()
  const pool = usePool(poolId, false)
  console.log('pool', pool)
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
      console.log('execute', values)
      const batch = [
        ...values.feed
          .filter((f) => typeof f.value === 'number' && !Number.isNaN(f.value))
          .map((f) =>
            api.tx.oraclePriceFeed.feed({ Isin: f.Isin }, CurrencyBalance.fromFloat(f.value, pool!.currency.decimals))
          ),
        api.tx.loans.updatePortfolioValuation(poolId),
      ]
      if (values.closeEpoch) {
        batch.push(api.tx.poolSystem.closeEpoch(poolId))
      }
      const tx = api.tx.utility.batchAll(batch)
      return cent.wrapSignAndSend(api, tx, options)
    }
  )

  console.log('allLoans', allLoans, loans)

  const initialValues = React.useMemo(
    () => ({
      feed: loans?.map((l) => ({ id: l.id, value: '' as any, Isin: l.pricing.Isin })) ?? [],
      closeEpoch: false,
    }),
    [loans]
  )

  const form = useFormik<FormValues>({
    initialValues,
    onSubmit(values, actions) {
      console.log('submit')
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

  console.log('form.values.feed', form.values.feed[1])

  return (
    <FormikProvider value={form}>
      <Form>
        <LayoutSection title="Update oracle values" pt={5}>
          <Select
            options={pools?.map((p) => ({ label: <PoolName poolId={p.id} />, value: p.id })) ?? []}
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
                  <Field name={`feed.${index}.value`}>
                    {({ field, meta, form }: FieldProps) => (
                      console.log('field.value', field.value),
                      (
                        <CurrencyInput
                          {...field}
                          errorMessage={meta.touched ? meta.error : undefined}
                          currency={pool?.currency.symbol}
                          onChange={(value) => form.setFieldValue(`feed.${index}.value`, value)}
                        />
                      )
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
