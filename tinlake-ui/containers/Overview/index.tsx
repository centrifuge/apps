import { ITinlake } from '@centrifuge/tinlake-js'
import { NextRouter, withRouter } from 'next/router'
import * as React from 'react'
import { connect } from 'react-redux'
import OverviewComp from '../../components/Overview'
import { Pool } from '../../config'
import { AuthState } from '../../ducks/auth'
import { loadPool, PoolState } from '../../ducks/pool'

interface Props {
  tinlake: ITinlake
  pool?: PoolState
  auth?: AuthState
  loadPool?: (tinlake: ITinlake) => Promise<void>
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
    const { loadPool, tinlake } = this.props
    loadPool && loadPool(tinlake)
  }

  render() {
    const { pool, selectedPool } = this.props

    return <OverviewComp pool={pool} selectedPool={selectedPool} tinlake={this.props.tinlake} />
  }
}

export default connect((state) => state, { loadPool })(withRouter(Overview))
