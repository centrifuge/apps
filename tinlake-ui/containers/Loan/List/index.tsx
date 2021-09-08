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
import DAI from '../../../static/dai.json'
import { useAssets } from '../../../utils/useAssets'
import { usePool } from '../../../utils/usePool'

interface Props {
  hideMetrics?: boolean
  tinlake: ITinlake
  auth?: AuthState
  activePool?: Pool
}

const LoanList: React.FC<Props> = (props) => {
  const { tinlake, auth, hideMetrics, activePool } = props
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const { data: loans, isLoading } = useAssets(tinlake.contractAddresses.ROOT_CONTRACT!)

  const availableFunds = poolData?.availableFunds || '0'
  if (isLoading) {
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
      <LoanListData activePool={activePool} loans={loans || []} userAddress={auth?.address || ''}>
        {' '}
      </LoanListData>
    </Box>
  )
}

export default connect((state) => state)(LoanList)
