import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { useCanBorrow, usePoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { OnboardingSettings } from '../Investors/OnboardingSettings'
import { Details } from './Details'
import { EpochAndTranches } from './EpochAndTranches'
import { Issuer } from './Issuer'
import { PoolConfig } from './PoolConfig'

export function IssuerPoolConfigurationPage() {
  return (
    <>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolConfiguration />
      </LoadBoundary>
    </>
  )
}

function IssuerPoolConfiguration() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

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
          {isPoolAdmin && <OnboardingSettings />}
          {editPoolConfig && <PoolConfig poolId={poolId} />}
        </>
      )}
    </Stack>
  )
}
