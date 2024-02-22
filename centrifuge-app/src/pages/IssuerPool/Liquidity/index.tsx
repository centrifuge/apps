import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolDetailLiquidity } from '../../Pool/Liquidity'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolLiquidityPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </LayoutBase>
  )
}
