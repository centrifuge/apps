import { Button, Select, Stack } from '@centrifuge/fabric'
import { Field, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useQueries } from 'react-query'
import { Redirect, useHistory, useParams } from 'react-router'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { useWeb3 } from '../components/Web3Provider'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { fetchMetadata } from '../utils/useMetadata'
import { usePermissions } from '../utils/usePermissions'
import { PoolMetadata, usePools } from '../utils/usePools'

export const CreateLoanPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreateLoan />
    </PageWithSideBar>
  )
}

type FormValues = {
  poolId: string
}

const CreateLoan: React.FC = () => {
  const { cid: collectionId, nftid: nftId } = useParams<{ cid: string; nftid: string }>()

  const { selectedAccount } = useWeb3()
  const permissions = usePermissions(selectedAccount?.address)
  const pools = usePools()
  const [redirect, setRedirect] = React.useState<string>()

  const history = useHistory()

  const poolIds = permissions
    ? Object.entries(permissions)
        .filter(([_, p]) => p.roles.includes('Borrower'))
        .map(([poolId]) => poolId)
    : []

  const allowedPools = pools ? pools.filter((p) => poolIds.includes(p.id)) : []

  const poolMetadataQueries = useQueries(
    allowedPools.map((pool) => {
      return {
        queryKey: ['metadata', pool.metadata],
        queryFn: () => fetchMetadata(pool.metadata),
        enabled: !!pool.metadata,
      }
    })
  )

  const poolSelectOptions = allowedPools.map((pool, i) => ({
    label: truncate((poolMetadataQueries[i].data as PoolMetadata)?.pool?.name || pool.id, 30),
    value: pool.id,
  }))

  const centrifuge = useCentrifuge()

  const form = useFormik<FormValues>({
    initialValues: {
      poolId: '',
    },
    onSubmit: (values, { setSubmitting }) => {
      doTransaction([values.poolId, collectionId, nftId])
      setSubmitting(false)
    },
  })

  const { execute: doTransaction, isLoading } = useCentrifugeTransaction(
    'Create asset',
    (cent) => cent.pools.createLoan,
    {
      onSuccess: async ([poolId], result) => {
        const api = await centrifuge.getApiPromise()
        const event = result.events.find(({ event }) => api.events.loans.Created.is(event))
        if (event) {
          const eventData = event.toHuman() as any
          const loanId = eventData.event.data[1].replace(/\D/g, '')

          // Doing the redirect via state, so it only happens if the user is still on this
          // page when the transaction completes
          setRedirect(`/pools/${poolId}/assets/${loanId}`)
        }
      },
    }
  )

  if (redirect) {
    return <Redirect to={redirect} />
  }

  return (
    <FormikProvider value={form}>
      <Form>
        <Stack gap={3} flex={1}>
          <PageHeader
            title="Create asset"
            actions={
              <>
                <Button variant="outlined" onClick={() => history.goBack()}>
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading} disabled={!form.values.poolId}>
                  Create
                </Button>
              </>
            }
            walletShown={false}
          />
          <Stack maxWidth={330}>
            <Field name="poolId">
              {({ field, form }: any) => (
                <Select
                  placeholder="Select a pool"
                  label="Pool"
                  options={poolSelectOptions}
                  value={field.value}
                  onSelect={(v) => form.setFieldValue('poolId', v)}
                  disabled={isLoading}
                />
              )}
            </Field>
          </Stack>
        </Stack>
      </Form>
    </FormikProvider>
  )
}

function truncate(txt: string, num: number) {
  if (txt.length > num) {
    return `${txt.slice(0, num)}...`
  }
  return txt
}
