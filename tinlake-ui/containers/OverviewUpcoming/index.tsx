import * as React from 'react'
import { connect } from 'react-redux'
import OverviewComp from '../../components/Overview'
import { UpcomingPool } from '../../config'
import { AuthState } from '../../ducks/auth'
import { LoansState } from '../../ducks/loans'
import { PoolState } from '../../ducks/pool'
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
