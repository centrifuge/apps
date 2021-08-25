import { Spinner } from '@centrifuge/axis-spinner'
import { Box } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { ITinlake } from '../../../../tinlake.js/dist'
import DashboardMetric from '../../../components/DashboardMetric'
import ERC20Display from '../../../components/ERC20Display'
import LoanListData from '../../../components/Loan/List'
import { Pool } from '../../../config'
import { AuthState } from '../../../ducks/auth'
import { loadLoans, LoansState } from '../../../ducks/loans'
import DAI from '../../../static/dai.json'
import { usePool } from '../../../utils/usePool'

interface Props {
  hideMetrics?: boolean
  tinlake: ITinlake
  loans?: LoansState
  loadLoans?: (tinlake: any) => Promise<void>
  auth?: AuthState
  activePool?: Pool
}

const LoanList: React.FC<Props> = (props) => {
  const { loadLoans, tinlake, loans, auth, hideMetrics, activePool } = props
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  React.useEffect(() => {
    loadLoans && loadLoans(tinlake)
  }, [])

  const availableFunds = poolData?.availableFunds || '0'
  if (loans!.loansState === 'loading') {
    return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
  }

  return (
    <Box margin={{ bottom: 'large' }}>
      {!hideMetrics && (
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
                <ERC20Display value={availableFunds ? availableFunds.toString() : '0'} tokenMetas={DAI} precision={2} />
              </Box>
            </DashboardMetric>
          </Box>
        </Box>
      )}
      <LoanListData activePool={activePool} loans={(loans && loans.loans) || []} userAddress={auth?.address || ''}>
        {' '}
      </LoanListData>
    </Box>
  )
}

export default connect((state) => state, { loadLoans })(LoanList)
