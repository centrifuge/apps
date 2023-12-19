import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { useCanBorrow, usePoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { Details } from './Details'
import { EpochAndTranches } from './EpochAndTranches'
import { Issuer } from './Issuer'
import { LoanTemplates } from './LoanTemplates'
import { PoolConfig } from './PoolConfig'
import { WriteOffGroups } from './WriteOffGroups'

export function IssuerPoolConfigurationPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolConfiguration />
      </LoadBoundary>
    </LayoutBase>
  )
}

function IssuerPoolConfiguration() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const { editPoolConfig } = useDebugFlags()
  const isPoolAdmin = !!usePoolAdmin(poolId)
  const isBorrower = useCanBorrow(poolId)

  return (
    <Stack>
      {(isPoolAdmin || isBorrower) && (
        <>
          <Details />
          <Issuer />
          <EpochAndTranches />
          <WriteOffGroups />
          <LoanTemplates />
          {editPoolConfig && <PoolConfig poolId={poolId} />}
        </>
      )}
    </Stack>
  )
}
