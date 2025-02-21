import Centrifuge, { ComputedMultisig, computeMultisig, PoolMetadata } from '@centrifuge/centrifuge-js'
import { CombinedSubstrateAccount, useCentrifugeApi, wrapProxyCallsForAccount } from '@centrifuge/centrifuge-react'
import { useFormikContext } from 'formik'
import * as React from 'react'
import { combineLatest, map, of } from 'rxjs'
import type { FormHandle } from '.'
import { diffPermissions } from '../../../../pages/IssuerPool/Configuration/Admins'
import { usePoolAccess } from '../../../../utils/usePermissions'
import { MultisigForm } from '../../../MultisigForm'

export type PoolManagersFormValues = {
  adminMultisigEnabled: boolean
  adminMultisig: {
    signers: string[]
    threshold: number
  }
}

export function PoolManagers({
  poolId,
  handle,
  account,
}: {
  poolId: string
  handle: React.RefObject<FormHandle>
  account: CombinedSubstrateAccount
}) {
  const access = usePoolAccess(poolId)
  const api = useCentrifugeApi()
  const form = useFormikContext<PoolManagersFormValues>()

  const initialValues: PoolManagersFormValues = React.useMemo(() => {
    const signers = access.multisig?.signers || access.adminDelegates?.map((d) => d.delegatee) || []
    return {
      adminMultisigEnabled: signers.length > 1,
      adminMultisig: {
        signers,
        threshold: access.multisig?.threshold || 1,
      },
    }
  }, [access.multisig, access.adminDelegates])

  function getBatch(cent: Centrifuge, values: PoolManagersFormValues, metadata: PoolMetadata) {
    const isMultisig = values.adminMultisig.threshold > 1
    const wasMultisig = initialValues.adminMultisig.threshold > 1
    let newMultisig: ComputedMultisig | null = null
    let newPoolMetadata = metadata
    let addedDelegates: string[] = []
    let removedDelegates: string[] = []

    const hasChanges =
      values.adminMultisig.threshold !== initialValues.adminMultisig.threshold ||
      values.adminMultisig.signers.length !== initialValues.adminMultisig.signers.length ||
      !values.adminMultisig.signers.every((s) => initialValues.adminMultisig.signers.includes(s))

    if (!hasChanges) return of({ batch: [], metadata })

    if (isMultisig) {
      newMultisig = computeMultisig(values.adminMultisig)
      newPoolMetadata = {
        ...metadata,
        adminMultisig: {
          signers: newMultisig.signers,
          threshold: newMultisig.threshold,
        },
      }
      addedDelegates = [newMultisig.address]
      removedDelegates = access.adminDelegates.map((p) => p.delegatee)
    } else {
      newMultisig = null
      if (wasMultisig) {
        addedDelegates = values.adminMultisig.signers
        removedDelegates = access.adminDelegates.map((p) => p.delegatee)
      } else {
        addedDelegates = values.adminMultisig.signers.filter((s) => !initialValues.adminMultisig.signers.includes(s))
        removedDelegates = initialValues.adminMultisig.signers.filter((s) => !values.adminMultisig.signers.includes(s))
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
      cent.pools.setMetadata([poolId, newPoolMetadata], { batch: true }),
      cent.pools.updatePoolRoles(
        [poolId, [...access.missingAdminPermissions, ...permissionsToAdd], permissionsToRemove],
        { batch: true }
      ),
    ]).pipe(
      map(([metadataTx, permissionTx]) => {
        return {
          batch: [
            wrapProxyCallsForAccount(
              api,
              api.tx.utility.batchAll([
                metadataTx,
                ...permissionTx.method.args[0],
                ...addedDelegates.map((addr) => api.tx.proxy.addProxy(addr, 'Any', 0)),
                ...removedDelegates.map((addr) => api.tx.proxy.removeProxy(addr, 'Any', 0)),
              ]),
              account,
              undefined
            ),
          ],
          metadata: newPoolMetadata,
        }
      })
    )
  }

  React.useImperativeHandle(handle, () => ({
    getBatch,
  }))

  React.useEffect(() => {
    form.setFieldValue('adminMultisig', initialValues.adminMultisig, false)
    form.setFieldValue('adminMultisigEnabled', initialValues.adminMultisigEnabled, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  return <MultisigForm cardProps={{ px: 2, py: 3 }} />
}
