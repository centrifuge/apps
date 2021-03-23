import { Spinner } from '@centrifuge/axis-spinner'
import { Box } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import DashboardMetric from '../../../components/DashboardMetric'
import ERC20Display from '../../../components/ERC20Display'
import LoanListData from '../../../components/Loan/List'
import { Pool } from '../../../config'
import { AuthState } from '../../../ducks/auth'
import { loadLoans, LoansState } from '../../../ducks/loans'
import { loadPool, PoolState } from '../../../ducks/pool'
import DAI from '../../../static/dai.json'

interface Props {
  hideMetrics?: boolean
  tinlake: any
  loans?: LoansState
  loadLoans?: (tinlake: any) => Promise<void>
  loadPool?: (tinlake: any) => Promise<void>
  auth?: AuthState
  pool?: PoolState
  activePool?: Pool
}

class LoanList extends React.Component<Props> {
  componentDidMount() {
    const { loadLoans, loadPool, tinlake } = this.props
    loadLoans && loadLoans(tinlake)
    loadPool && loadPool(tinlake)
  }

  render() {
    const { loans, pool, auth } = this.props
    const availableFunds = (pool && pool.data && pool.data.availableFunds) || '0'
    if (loans!.loansState === 'loading') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
    }

    return (
      <Box margin={{ bottom: 'large' }}>
        {!this.props.hideMetrics && (
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
                  <ERC20Display
                    value={availableFunds ? availableFunds.toString() : '0'}
                    tokenMetas={DAI}
                    precision={2}
                  />
                </Box>
              </DashboardMetric>
            </Box>
          </Box>
        )}
        <LoanListData
          activePool={this.props.activePool}
          loans={(loans && loans.loans) || []}
          userAddress={auth?.address || ''}
        >
          {' '}
        </LoanListData>
      </Box>
    )
  }
}

export default connect((state) => state, { loadLoans, loadPool })(LoanList)
