import Centrifuge, { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Accordion, Box, Button, Drawer, Select, Stack } from '@centrifuge/fabric'
import { Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import { useEffect, useRef, useState } from 'react'
import { ObservableInput, defer, firstValueFrom, from, switchMap } from 'rxjs'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePoolAccess, useSuitableAccounts } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { LoadBoundary } from '../LoadBoundary'
import { AOFormValues, AssetOriginators } from './Access/AssetOriginator'
import { FeedersFormValues, OracleFeeders } from './Access/OracleFeeders'
import { PoolManagers, PoolManagersFormValues } from './Access/PoolManagers'

type FormValues = FeedersFormValues & PoolManagersFormValues & AOFormValues

export type FormHandle = {
  getBatch: (
    cent: Centrifuge,
    values: FormValues,
    metadata: PoolMetadata
  ) => ObservableInput<{ batch: any[]; metadata: PoolMetadata }>
  validate?: (values: FormValues) => FormikErrors<any>
}

export function AccessDrawer({
  isOpen,
  onClose,
  poolIds,
}: {
  onClose: () => void
  isOpen: boolean
  poolIds: string[]
}) {
  const [poolId, setPoolId] = useState<string>('')

  useEffect(() => {
    if (poolIds.includes(poolId)) return
    setPoolId(poolIds[0] || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolIds.length])

  return (
    <Drawer title="Manage Access" isOpen={isOpen} onClose={onClose} overflow="hidden">
      <Select
        label="Select pool"
        onChange={(event) => {
          setPoolId(event.target.value)
        }}
        value={poolId}
        options={poolIds.map((id) => ({ label: <PoolName poolId={id} />, value: id }))}
      />
      <LoadBoundary>{poolId && <AccessDrawerInner poolId={poolId} key={poolId} onClose={onClose} />}</LoadBoundary>
    </Drawer>
  )
}

function PoolName({ poolId }: { poolId: string }) {
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  return metadata?.pool?.name || poolId
}

function AccessDrawerInner({ poolId, onClose }: { poolId: string; onClose: () => void }) {
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const api = useCentrifugeApi()
  const formRef = useRef<HTMLFormElement>(null)
  const poolManagersRef = useRef<FormHandle>(null)
  const aoRef = useRef<FormHandle>(null)
  const feedersRef = useRef<FormHandle>(null)
  const refs = [aoRef, feedersRef, poolManagersRef]

  const access = usePoolAccess(poolId)
  const ao = access.assetOriginators[0]
  const [aoDelegateAccount] = useSuitableAccounts({ poolId, actingAddress: [ao?.address || ''] }).filter(
    (a) => a.proxies?.length === 2
  )
  const adminDelegateAccounts = useSuitableAccounts({
    poolId,
    poolRole: ['PoolAdmin'],
    actingAddress: [access.admin || ''],
  })
  const adminDelegateAccount = adminDelegateAccounts.find((a) => a.signingAccount === aoDelegateAccount?.signingAccount)

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update permissions',
    (cent) =>
      ([values]: [values: FormValues], options) => {
        return defer(async () => {
          let newMetadata = metadata as PoolMetadata
          const batches = []
          for (const ref of refs) {
            const { batch, metadata: updatedMetadata } = await firstValueFrom(
              from(ref.current!.getBatch(cent, values, newMetadata))
            )
            batches.push(batch)
            newMetadata = updatedMetadata
          }

          if (newMetadata !== metadata) {
            batches.unshift(await firstValueFrom(cent.pools.setMetadata([poolId, newMetadata], { batch: true })))
          }
          return batches.flat()
        }).pipe(
          switchMap((batch) => {
            return cent.wrapSignAndSend(api, api.tx.utility.batchAll(batch), { ...options, proxies: undefined })
          })
        )
      }
  )

  const form = useFormik<FormValues>({
    initialValues: {
      feeders: [],
      minFeeders: 1,
      adminMultisigEnabled: false,
      adminMultisig: {
        signers: [],
        threshold: 1,
      },
      withdrawAddresses: [],
      delegates: [],
    },
    validate: (values) => {
      const errors: any = {}
      for (const ref of refs) {
        const errors = ref.current?.validate?.(values) || {}
        if (errors) {
          Object.assign(errors, errors)
        }
      }
      return errors
    },
    onSubmit: async (values, actions) => {
      actions.setSubmitting(false)
      execute([values], { account: adminDelegateAccount })
    },
  })

  useFocusInvalidInput(form, formRef)

  if (!aoDelegateAccount || !adminDelegateAccount) return null

  return (
    <FormikProvider value={form}>
      <Form noValidate ref={formRef}>
        <Box display="flex" flexDirection="column" height="75vh" mx={1}>
          <Stack gap={3} flex={1} overflow="auto">
            <Accordion
              items={[
                {
                  title: 'Pool managers',
                  body: <PoolManagers poolId={poolId} handle={poolManagersRef} account={adminDelegateAccount} />,
                  sublabel: 'Pool managers can manage investors and the liquidity reserve of the pool.',
                },
                {
                  title: 'Pool delegates',
                  body: (
                    <Stack gap={3}>
                      <AssetOriginators poolId={poolId} handle={aoRef} account={aoDelegateAccount} />
                      <OracleFeeders poolId={poolId} handle={feedersRef} account={adminDelegateAccount} />
                    </Stack>
                  ),
                  sublabel: 'Pool delegates are authorized to perform designated pool actions by the pool manager.',
                },
                ...(editAdminConfig
                  ? [
                      {
                        title: 'Admin config',
                        body: <DebugAdmins poolId={poolId} handle={debugAdminsRef} />,
                        sublabel: 'Debug flag access to admin config',
                      },
                    ]
                  : []),
              ]}
            />
          </Stack>
          <Stack gap={1} bg="backgroundPrimary" mt={3}>
            <Button type="submit" loading={isLoading}>
              Update
            </Button>
            <Button variant="inverted" onClick={() => onClose()}>
              Cancel
            </Button>
          </Stack>
        </Box>
      </Form>
    </FormikProvider>
  )
}
