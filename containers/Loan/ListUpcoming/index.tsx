import * as React from 'react'
import { Box } from 'grommet'
import LoanListData from '../../../components/Loan/List'
import DashboardMetric from '../../../components/DashboardMetric'
import DAI from '../../../static/dai.json'
import ERC20Display from '../../../components/ERC20Display'
import { connect } from 'react-redux'
import { AuthState } from '../../../ducks/auth'

interface Props {
  auth?: AuthState
}

class LoanListUpcoming extends React.Component<Props> {
  render() {
    const { auth } = this.props

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
        <LoanListData loans={[]} userAddress={auth?.address || ''}>
          {' '}
        </LoanListData>
      </Box>
    )
  }
}

export default connect((state) => state)(LoanListUpcoming)
