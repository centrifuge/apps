import Centrifuge, { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Accordion, Box, Button, Drawer, Select, Stack, Text } from '@centrifuge/fabric'
import { Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import { useRef, useState } from 'react'
import { ObservableInput, defer, firstValueFrom, from, switchMap } from 'rxjs'
import { useSelectedPools } from '../../../../utils/contexts/SelectedPoolsContext'
import { useFocusInvalidInput } from '../../../../utils/useFocusInvalidInput'
import { usePoolAccess, usePoolAdmin, useSuitableAccounts } from '../../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../../utils/usePools'
import { useDebugFlags } from '../../../DebugFlags'
import { LoadBoundary } from '../../../LoadBoundary'
import { AOFormValues, AssetOriginators } from './AssetOriginator'
import { DebugAdmins, DebugAdminsFormValues } from './DebugAdmins'
import { FeedersFormValues, OracleFeeders } from './OracleFeeders'
import { PoolManagers, PoolManagersFormValues } from './PoolManagers'

type FormValues = FeedersFormValues & PoolManagersFormValues & AOFormValues & DebugAdminsFormValues

export type FormHandle = {
  getBatch: (
    cent: Centrifuge,
    values: FormValues,
    metadata: PoolMetadata
  ) => ObservableInput<{ batch: any[]; metadata: PoolMetadata }>
  hasChanges: (values: FormValues) => boolean
  validate?: (values: FormValues) => FormikErrors<any>
}

export function AccessDrawer({ isOpen, onClose }: { onClose: () => void; isOpen: boolean }) {
  const { selectedPoolsWithMetadata, selectedPoolIds } = useSelectedPools()
  const [selectedPoolId, setSelectedPoolId] = useState<string>(selectedPoolsWithMetadata?.[0].id ?? '')
  const isPoolAdmin = !!usePoolAdmin(selectedPoolId)
  return (
    <Drawer title="Manage Access" isOpen={isOpen} onClose={onClose} overflow="hidden">
      <Select
        label="Select pool"
        onChange={(event) => setSelectedPoolId(event.target.value)}
        value={selectedPoolId}
        options={selectedPoolIds.map((id) => ({ label: <PoolName poolId={id} />, value: id }))}
      />
      {!isPoolAdmin && (
        <Text variant="body2" color="textSecondary">
          Only pool admins can manage access.
        </Text>
      )}
      <LoadBoundary>
        {selectedPoolId && <AccessDrawerInner poolId={selectedPoolId} key={selectedPoolId} onClose={onClose} />}
      </LoadBoundary>
    </Drawer>
  )
}

function PoolName({ poolId }: { poolId: string }) {
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  return metadata?.pool?.name || poolId
}

function AccessDrawerInner({ poolId, onClose }: { poolId: string; onClose: () => void }) {
  const { editAdminConfig } = useDebugFlags()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const api = useCentrifugeApi()
  const formRef = useRef<HTMLFormElement>(null)
  const poolManagersRef = useRef<FormHandle>(null)
  const aoRef = useRef<FormHandle>(null)
  const feedersRef = useRef<FormHandle>(null)
  const debugAdminsRef = useRef<FormHandle>(null)
  const refs = [aoRef, feedersRef, poolManagersRef, debugAdminsRef]
  const admin = usePoolAdmin(poolId)

  const access = usePoolAccess(poolId)
  const ao = access.assetOriginators[0]
  const [aoDelegateAccount] = useSuitableAccounts({ poolId, actingAddress: [ao?.address || ''] }).filter(
    (a) => a.proxies?.length === 2
  )
  const adminDelegateAccounts = useSuitableAccounts({
    poolId,
    poolRole: ['PoolAdmin'],
    actingAddress: [access.admin || admin?.signingAccount.address || ''],
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
            if (!ref.current) continue
            const { batch, metadata: updatedMetadata } = await firstValueFrom(
              from(ref.current.getBatch(cent, values, newMetadata))
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
      admins: [],
    },
    validate: (values) => {
      const combinedErrors = {}
      for (const ref of refs) {
        const refErrors = ref.current?.validate?.(values) || {}
        Object.assign(combinedErrors, refErrors)
      }
      return combinedErrors
    },
    onSubmit: async (values, actions) => {
      actions.setSubmitting(false)
      execute([values], { account: adminDelegateAccount })
    },
  })

  useFocusInvalidInput(form, formRef)

  if (!aoDelegateAccount || !adminDelegateAccount) return null

  const hasChanges = refs.some((ref) => ref.current?.hasChanges(form.values))

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
            <Button type="submit" loading={isLoading} disabled={!form.isValid || !hasChanges}>
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
