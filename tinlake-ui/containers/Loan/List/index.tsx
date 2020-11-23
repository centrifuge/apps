import * as React from 'react'
import { Box } from 'grommet'
import { connect } from 'react-redux'
import { LoansState, loadLoans } from '../../../ducks/loans'
import { PoolState, loadPool } from '../../../ducks/pool'
import { Spinner } from '@centrifuge/axis-spinner'
import { AuthState } from '../../../ducks/auth'
import LoanListData from '../../../components/Loan/List'
import DashboardMetric from '../../../components/DashboardMetric'
import DAI from '../../../static/dai.json'
import ERC20Display from '../../../components/ERC20Display'

interface Props {
  hideMetrics?: boolean
  tinlake: any
  loans?: LoansState
  loadLoans?: (tinlake: any) => Promise<void>
  loadPool?: (tinlake: any) => Promise<void>
  auth?: AuthState
  pool?: PoolState
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
        <LoanListData loans={(loans && loans.loans) || []} userAddress={auth?.address || ''}>
          {' '}
        </LoanListData>
      </Box>
    )
  }
}

export default connect((state) => state, { loadLoans, loadPool })(LoanList)
