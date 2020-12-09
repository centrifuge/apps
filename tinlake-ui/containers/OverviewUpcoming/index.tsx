import * as React from 'react'
import { connect } from 'react-redux'
import OverviewComp from '../../components/Overview'
import { UpcomingPool } from '../../config'
import { AuthState } from '../../ducks/auth'
import { PoolState } from '../../ducks/pool'
import { upcomingPoolToPooldata } from '../../utils/upcomingPoolToPoolData'

interface Props {
  tinlake: any
  pool?: PoolState
  auth?: AuthState
  selectedPool: UpcomingPool
}

class OverviewUpcoming extends React.Component<Props> {
  render() {
    const { selectedPool } = this.props

    return (
      <OverviewComp
        pool={{ data: upcomingPoolToPooldata(selectedPool), state: 'found', poolId: selectedPool.metadata.slug }}
        selectedPool={selectedPool}
      />
    )
  }
}

export default connect((state) => state)(OverviewUpcoming)
