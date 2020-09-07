import * as React from 'react'
import { Box } from 'grommet'
import InvestmentsOverview from '../../../components/Investment/Overview'
import { UpcomingPool } from '../../../config'
import { upcomingPoolToPooldata } from '../../../utils/upcomingPoolToPoolData'

interface Props {
  pool: UpcomingPool
}

class InvestmentsViewUpcoming extends React.Component<Props> {
  render() {
    return (
      <Box>
        <Box margin={{ bottom: 'medium' }}>
          {' '}
          <InvestmentsOverview data={upcomingPoolToPooldata(this.props.pool)} />{' '}
        </Box>
      </Box>
    )
  }
}

export default InvestmentsViewUpcoming
