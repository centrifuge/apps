import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolDetailLiquidity } from '../../Pool/Liquidity'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolLiquidityPage() {
  return (
    <>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </>
  )
}
