import { ITinlake } from '@centrifuge/tinlake-js'
import { NextRouter, withRouter } from 'next/router'
import * as React from 'react'
import { connect } from 'react-redux'
import OverviewComp from '../../components/Overview'
import { Pool } from '../../config'
import { AuthState } from '../../ducks/auth'
import { loadLoans, LoansState } from '../../ducks/loans'
import { loadPool, PoolState } from '../../ducks/pool'
import { PoolsState } from '../../ducks/pools'

interface Props {
  tinlake: ITinlake
  loans?: LoansState
  loadLoans?: (tinlake: ITinlake) => Promise<void>
  pool?: PoolState
  pools: PoolsState
  auth?: AuthState
  loadPool?: (tinlake: ITinlake) => Promise<void>
  selectedPool: Pool
  router: NextRouter
}

class Overview extends React.Component<Props> {
  componentDidMount() {
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
    const { auth, loans, selectedPool, pools, pool } = this.props
    console.log("loading in overview container", pools, "POOL", pool, "configPools")
    return pools.data && <OverviewComp userAddress={auth?.address || ''} loans={loans} selectedPool={selectedPool}/>
  }
}

export default connect((state) => state, { loadLoans, loadPool })(withRouter(Overview))
