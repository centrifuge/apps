import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { OracleFeeders } from './OracleFeeders'

export function IssuerPoolPricingPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolPricing />
      </LoadBoundary>
    </LayoutBase>
  )
}

function IssuerPoolPricing() {
  const { pid: poolId } = useParams<{ pid: string }>()

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
