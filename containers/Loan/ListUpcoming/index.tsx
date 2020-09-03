import * as React from 'react'
import { Box } from 'grommet'
import LoanListData from '../../../components/Loan/List'
import DashboardMetric from '../../../components/DashboardMetric'
import DAI from '../../../static/dai.json'
import ERC20Display from '../../../components/ERC20Display'

interface Props {
  tinlake: any
}

class LoanListUpcoming extends React.Component<Props> {
  render() {
    const {
      tinlake: {
        ethConfig: { from: ethFrom },
      },
    } = this.props

    return (
      <Box margin={{ bottom: 'large' }}>
        <Box direction="row" align="center">
          <Box
            basis={'full'}
            gap="medium"
            align="center"
            alignSelf="center"
            margin={{ bottom: 'medium' }}
            style={{ fontSize: '1.4em' }}
          >
            <DashboardMetric label="Pool Reserve">
              <Box align="center">
                <ERC20Display value={'0'} tokenMetas={DAI} precision={2} />
              </Box>
            </DashboardMetric>
          </Box>
        </Box>
        <LoanListData loans={[]} userAddress={ethFrom}>
          {' '}
        </LoanListData>
      </Box>
    )
  }
}

export default LoanListUpcoming
