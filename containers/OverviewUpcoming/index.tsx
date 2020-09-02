import * as React from 'react'
import { connect } from 'react-redux'
import { PoolState, loadPool } from '../../ducks/pool'
import { LoansState, loadLoans } from '../../ducks/loans'
import { AuthState } from '../../ducks/auth'
import { UpcomingPool } from '../../config'
import OverviewComp from '../../components/Overview'

interface Props {
  tinlake: any
  loans?: LoansState
  pool?: PoolState
  auth?: AuthState
  selectedPool: UpcomingPool
}

class OverviewUpcoming extends React.Component<Props> {
  render() {
    const { auth, tinlake, loans, pool, selectedPool } = this.props

    return (
      <OverviewComp
        userAddress={auth?.address || tinlake.ethConfig.from}
        loans={loans}
        pool={pool}
        selectedPool={selectedPool}
      />
    )
  }
}

export default connect((state) => state, { loadLoans, loadPool })(OverviewUpcoming)
