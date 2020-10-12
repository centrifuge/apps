import * as React from 'react'
import { connect } from 'react-redux'
import { PoolState, loadPool } from '../../ducks/pool'
import { LoansState, loadLoans } from '../../ducks/loans'
import { AuthState } from '../../ducks/auth'
import { Pool } from '../../config'
import { withRouter, NextRouter } from 'next/router'
import OverviewComp from '../../components/Overview'
import { ITinlake } from '@centrifuge/tinlake-js'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'

interface Props {
  tinlake: ITinlake | ITinlakeV3
  loans?: LoansState
  loadLoans?: (tinlake: ITinlake | ITinlakeV3) => Promise<void>
  pool?: PoolState
  auth?: AuthState
  loadPool?: (tinlake: ITinlake | ITinlakeV3) => Promise<void>
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
    const { auth, loans, pool, selectedPool } = this.props

    return <OverviewComp userAddress={auth?.address || ''} loans={loans} pool={pool} selectedPool={selectedPool} />
  }
}

export default connect((state) => state, { loadLoans, loadPool })(withRouter(Overview))
