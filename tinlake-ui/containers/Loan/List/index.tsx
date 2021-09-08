import { Spinner } from '@centrifuge/axis-spinner'
import * as React from 'react'
import { connect } from 'react-redux'
import { ITinlake } from '../../../../tinlake.js/dist'
import LoanListData from '../../../components/Loan/List'
import { Pool } from '../../../config'
import { AuthState } from '../../../ducks/auth'
import { useAssets } from '../../../utils/useAssets'

interface Props {
  tinlake: ITinlake
  auth?: AuthState
  activePool?: Pool
}

const LoanList: React.FC<Props> = (props) => {
  const { tinlake, auth, activePool } = props

  const { data: assetsData, isLoading } = useAssets(tinlake.contractAddresses.ROOT_CONTRACT!)

  if (isLoading) {
    return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
  }

  return (
    <LoanListData activePool={activePool} loans={assetsData || []} userAddress={auth?.address || ''}>
      {' '}
    </LoanListData>
  )
}

export default connect((state) => state)(LoanList)
