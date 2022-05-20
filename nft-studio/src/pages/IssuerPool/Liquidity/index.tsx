import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PoolDetailLiquidity } from '../../PoolDetail/LiquidityTab'
import { IssuerPoolHeader } from '../Header'

export const IssuerPoolLiquidityPage: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const [isEditingMaxReserve, setIsEditingMaxReserve] = React.useState(false)
  return (
    <PageWithSideBar sidebar={isEditingMaxReserve ? <MaxReserveForm poolId={poolId} /> : true}>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailLiquidity setIsEditingMaxReserve={setIsEditingMaxReserve} />
      </LoadBoundary>
    </PageWithSideBar>
  )
}
