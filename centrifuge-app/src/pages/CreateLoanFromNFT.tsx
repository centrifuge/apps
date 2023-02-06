import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Select, Stack } from '@centrifuge/fabric'
import { Field, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Redirect, useHistory, useParams } from 'react-router'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { truncateText } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useMetadataMulti } from '../utils/useMetadata'
import { usePermissions } from '../utils/usePermissions'
import { usePools } from '../utils/usePools'

export const CreateLoanFromNFTPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreateLoanFromNFT />
    </PageWithSideBar>
  )
}

type FormValues = {
  poolId: string
}

const CreateLoanFromNFT: React.FC = () => {
  const { cid: collectionId, nftid: nftId } = useParams<{ cid: string; nftid: string }>()

  const address = useAddress()
  const permissions = usePermissions(address)
  const pools = usePools()
  const [redirect, setRedirect] = React.useState<string>()

  const history = useHistory()

  const poolIds = permissions
    ? Object.entries(permissions.pools)
        .filter(([_, p]) => p.roles.includes('Borrower'))
        .map(([poolId]) => poolId)
    : []

  const allowedPools = pools ? pools.filter((p) => poolIds.includes(p.id)) : []

  const poolMetadata = useMetadataMulti(allowedPools.map((pool) => pool.metadata))

  const poolSelectOptions = allowedPools.map((pool, i) => ({
    label: truncateText((poolMetadata[i].data as PoolMetadata)?.pool?.name || pool.id, 30),
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
          const loanId = eventData.event.data.loanId

          // Doing the redirect via state, so it only happens if the user is still on this
          // page when the transaction completes
          setRedirect(`/issuer/${poolId}/assets/${loanId}`)
        } else {
          setRedirect(`/issuer/${poolId}/assets`)
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
        <Stack>
          <PageHeader
            title="Create asset"
            actions={
              <>
                <Button variant="secondary" onClick={() => history.goBack()}>
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading} disabled={!form.values.poolId}>
                  Create
                </Button>
              </>
            }
          />
          <PageSection>
            <Box maxWidth={400}>
              <Field name="poolId">
                {({ field, form }: any) => (
                  <Select
                    name="poolId"
                    placeholder="Select a pool"
                    label="Pool"
                    options={poolSelectOptions}
                    value={field.value}
                    onChange={(event) => form.setFieldValue('poolId', event.target.value)}
                    disabled={isLoading}
                  />
                )}
              </Field>
            </Box>
          </PageSection>
        </Stack>
      </Form>
    </FormikProvider>
  )
}
