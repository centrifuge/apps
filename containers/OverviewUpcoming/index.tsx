import * as React from 'react'
import { connect } from 'react-redux'
import { PoolState } from '../../ducks/pool'
import { LoansState } from '../../ducks/loans'
import { AuthState } from '../../ducks/auth'
import { UpcomingPool } from '../../config'
import OverviewComp from '../../components/Overview'
import { upcomingPoolToPooldata } from '../../utils/upcomingPoolToPoolData'

interface Props {
  tinlake: any
  loans?: LoansState
  pool?: PoolState
  auth?: AuthState
  selectedPool: UpcomingPool
}

class OverviewUpcoming extends React.Component<Props> {
  render() {
    const { auth, selectedPool } = this.props

    return (
      <OverviewComp
        userAddress={auth?.address || ''}
        loans={{ loans: [], loansState: 'found', loan: null, loanState: null }}
        pool={{ data: upcomingPoolToPooldata(selectedPool), state: 'found' }}
        selectedPool={selectedPool}
      />
    )
  }
}

export default connect((state) => state)(OverviewUpcoming)
