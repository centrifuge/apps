import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { OracleFeeders } from './OracleFeeders'

export function IssuerPoolPricingPage() {
  return (
    <>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolPricing />
      </LoadBoundary>
    </>
  )
}

function IssuerPoolPricing() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  return (
    <Stack>
      {!!usePoolAdmin(poolId) && (
        <>
          <OracleFeeders poolId={poolId} />
        </>
      )}
    </Stack>
  )
}
