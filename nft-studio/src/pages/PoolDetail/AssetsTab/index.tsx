import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { LoanList } from '../../../components/LoanList'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useLoans } from '../../../utils/useLoans'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailAssetsTab: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const PoolDetailAssets: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const loans = useLoans(poolId)
  const history = useHistory()

  if (!pool || !loans) return null

  return (
    <PageSection title="Assets">
      {loans.length ? (
        <LoanList
          loans={loans}
          onLoanClicked={(loan) => {
            history.push(`/pools/${pool.id}/assets/${loan.id}`)
          }}
        />
      ) : (
        <Text>No assets have been originated yet</Text>
      )}
    </PageSection>
  )
}
