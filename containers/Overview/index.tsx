import * as React from 'react'
import { connect } from 'react-redux'
import { PoolState, loadPool } from '../../ducks/pool'
import { LoansState, loadLoans } from '../../ducks/loans'
import { AuthState } from '../../ducks/auth'
import Tinlake from 'tinlake/dist/Tinlake'
import { Pool } from '../../config'
import { withRouter, NextRouter } from 'next/router'
import OverviewComp from '../../components/Overview'

interface Props {
  tinlake: any
  loans?: LoansState
  loadLoans?: (tinlake: Tinlake) => Promise<void>
  pool?: PoolState
  auth?: AuthState
  loadPool?: (tinlake: Tinlake) => Promise<void>
  selectedPool: Pool
  router: NextRouter
}

class Overview extends React.Component<Props> {
  componentWillMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.router.query.root !== prevProps.router.query.root) {
      this.loadData()
    }
  }

  loadData() {
    const { loadLoans, loadPool, tinlake } = this.props
    loadLoans && loadLoans(tinlake)
    loadPool && loadPool(tinlake)
  }

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

export default connect((state) => state, { loadLoans, loadPool })(withRouter(Overview))
