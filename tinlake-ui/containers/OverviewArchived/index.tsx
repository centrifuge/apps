import * as React from 'react'
import { connect } from 'react-redux'
import Archived from '../../components/Overview/Archived'
import { ArchivedPool } from '../../config'

interface Props {
  selectedPool: ArchivedPool
}

class OverviewArchived extends React.Component<Props> {
  render() {
    const { selectedPool } = this.props
    return <Archived selectedPool={selectedPool} />
  }
}

export default connect((state) => state)(OverviewArchived)
