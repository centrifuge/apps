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
  adminMultisigEnabled: boolean
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

  const initialValues: PoolManagersInput = React.useMemo(() => {
    const signers = access.multisig?.signers || access.adminDelegates?.map((d) => d.delegatee) || []
    return {
      adminMultisigEnabled: signers.length > 1,
      adminMultisig: {
        signers,
        threshold: access.multisig?.threshold || 1,
      },
    }
  }, [access?.multisig, access?.adminDelegates])

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update pool managers',
    (cent) => (args: [values: PoolManagersInput], options) => {
      const [values] = args
      const isMultisig = values.adminMultisig.threshold > 1
      const wasMultisig = initialValues.adminMultisig.threshold > 1
      let newMultisig: ComputedMultisig | null = null
      let newPoolMetadata: PoolMetadata
      let addedDelegates: string[] = []
      let removedDelegates: string[] = []

      if (isMultisig) {
        newMultisig = computeMultisig(values.adminMultisig)
        newPoolMetadata = {
          ...(metadata as PoolMetadata),
          adminMultisig: {
            signers: newMultisig.signers,
            threshold: newMultisig.threshold,
          },
        }
        addedDelegates = [newMultisig.address]
        removedDelegates = access.adminDelegates.map((p) => p.delegatee)
      } else {
        newMultisig = null
        newPoolMetadata = {
          ...(metadata as PoolMetadata),
          adminMultisig: undefined,
        }
        if (wasMultisig) {
          addedDelegates = values.adminMultisig.signers
          removedDelegates = access.adminDelegates.map((p) => p.delegatee)
        } else {
          addedDelegates = values.adminMultisig.signers.filter((s) => !initialValues.adminMultisig.signers.includes(s))
          removedDelegates = initialValues.adminMultisig.signers.filter(
            (s) => !values.adminMultisig.signers.includes(s)
          )
        }
      }
      const { add: permissionsToAdd, remove: permissionsToRemove } = diffPermissions(
        access.managerPermissions,
        values.adminMultisig.signers.map((address) => ({
          address,
          roles: { InvestorAdmin: true, LiquidityAdmin: true },
        })),
        ['LiquidityAdmin', 'InvestorAdmin']
      )

      return combineLatest([
        cent.getApi(),
        cent.pools.setMetadata([poolId, newPoolMetadata], { batch: true }),
        cent.pools.updatePoolRoles(
          [poolId, [...access.missingAdminPermissions, ...permissionsToAdd], permissionsToRemove],
          { batch: true }
        ),
      ]).pipe(
        switchMap(([api, metadataTx, permissionTx]) => {
          const tx = api.tx.utility.batchAll([
            metadataTx,
            ...permissionTx.method.args[0],
            ...addedDelegates.map((addr) => api.tx.proxy.addProxy(addr, 'Any', 0)),
            ...removedDelegates.map((addr) => api.tx.proxy.removeProxy(addr, 'Any', 0)),
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
      execute([values], { account })
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
          <MultisigForm />
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
