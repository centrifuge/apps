import { ComputedMultisig, computeMultisig, PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { PageSection } from '../../../components/PageSection'
import { usePoolAccess, usePoolPermissions, useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { diffPermissions } from '../Configuration/Admins'
import { MultisigForm } from './MultisigForm'

export type PoolManagersInput = {
  adminMultisig: {
    signers: string[]
    threshold: number
  }
}

export function PoolManagers({ poolId }: { poolId: string }) {
  const access = usePoolAccess(poolId)
  const pool = usePool(poolId)
  const [isEditing, setIsEditing] = React.useState(false)
  const poolPermissions = usePoolPermissions(poolId)
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })
  const { data: metadata } = usePoolMetadata(pool)

  const initialValues: PoolManagersInput = React.useMemo(
    () => ({
      adminMultisig: {
        signers: access.multisig?.signers || [],
        threshold: access.multisig?.threshold || 1,
      },
    }),
    [access?.multisig]
  )

  const storedManagerPermissions = poolPermissions
    ? Object.entries(poolPermissions)
        .filter(([addr, p]) => p.roles.length && initialValues.adminMultisig.signers.includes(addr))
        .map(([address, permissions]) => ({
          address,
          roles: Object.fromEntries(permissions.roles.map((role) => [role, true])),
        }))
    : []

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update pool managers',
    (cent) =>
      (
        args: [
          newMultisig: ComputedMultisig,
          permissionChanges: ReturnType<typeof diffPermissions>,
          newMetadata: PoolMetadata
        ],
        options
      ) => {
        const [newMultisig, permissionChanges, newMetadata] = args

        return combineLatest([
          cent.getApi(),
          cent.pools.setMetadata([poolId, newMetadata as any], { batch: true }),
          cent.pools.updatePoolRoles(
            [poolId, [...access.missingAdminPermissions, ...permissionChanges.add], permissionChanges.remove],
            { batch: true }
          ),
        ]).pipe(
          switchMap(([api, metadataTx, permissionTx]) => {
            const tx = api.tx.utility.batchAll([
              metadataTx,
              ...permissionTx.method.args[0],
              api.tx.proxy.addProxy(newMultisig.address, 'Any', 0),
              api.tx.proxy.removeProxy(access.multisig!.address, 'Any', 0),
            ])
            return cent.wrapSignAndSend(api, tx, options)
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
    onSubmit: (values, actions) => {
      if (!metadata || !poolPermissions) return
      actions.setSubmitting(false)
      const newMultisig = computeMultisig(values.adminMultisig)

      const newPoolMetadata: PoolMetadata = {
        ...(metadata as PoolMetadata),
        adminMultisig: {
          signers: newMultisig.signers,
          threshold: newMultisig.threshold,
        },
      }

      execute(
        [
          newMultisig,
          diffPermissions(
            storedManagerPermissions,
            values.adminMultisig.signers.map((address) => ({
              address,
              roles: { InvestorAdmin: true, LiquidityAdmin: true },
            })),
            ['LiquidityAdmin', 'InvestorAdmin']
          ),
          newPoolMetadata,
        ],
        { account }
      )
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  const { adminMultisig } = form.values
  const hasChanges =
    adminMultisig.threshold !== initialValues.adminMultisig.threshold ||
    adminMultisig.signers.length !== initialValues.adminMultisig.signers.length ||
    !adminMultisig.signers.every((s) => initialValues.adminMultisig.signers.includes(s))

  if (!access.multisig) return null

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Pool managers"
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  small
                  loading={isLoading}
                  loadingMessage={isLoading ? 'Pending...' : undefined}
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
          <MultisigForm isEditing={isEditing} isLoading={isLoading} />
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
