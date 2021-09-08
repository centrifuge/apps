import { Spinner } from '@centrifuge/axis-spinner'
import * as React from 'react'
import { connect } from 'react-redux'
import { ITinlake } from '../../../../tinlake.js/dist'
import LoanListData from '../../../components/Loan/List'
import { Pool } from '../../../config'
import { AuthState } from '../../../ducks/auth'
import { loadLoans, LoansState } from '../../../ducks/loans'

interface Props {
  tinlake: ITinlake
  loans?: LoansState
  loadLoans?: (tinlake: any) => Promise<void>
  auth?: AuthState
  activePool?: Pool
}

const LoanList: React.FC<Props> = (props) => {
  const { loadLoans, tinlake, loans, auth, activePool } = props

  React.useEffect(() => {
    loadLoans && loadLoans(tinlake)
  }, [])

  if (loans!.loansState === 'loading') {
    return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
  }

  return (
    <LoanListData activePool={activePool} loans={(loans && loans.loans) || []} userAddress={auth?.address || ''}>
      {' '}
    </LoanListData>
  )
}

export default connect((state) => state, { loadLoans })(LoanList)
