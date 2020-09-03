import * as React from 'react'
import { Box } from 'grommet'
import InvestmentsOverview from '../../../components/Investment/Overview'
import { PoolData } from '../../../ducks/pool'
import BN from 'bn.js'
import { Tranche } from 'tinlake'

class InvestmentsViewUpcoming extends React.Component {
  render() {
    return (
      <Box>
        <Box margin={{ bottom: 'medium' }}>
          {' '}
          <InvestmentsOverview data={emptyPoolData} />{' '}
        </Box>
      </Box>
    )
  }
}

export default InvestmentsViewUpcoming

const emptyTranche: Tranche = {
  availableFunds: new BN(0),
  tokenPrice: new BN(0),
  type: '',
  token: '',
  totalSupply: new BN(0),
  interestRate: new BN(0),
}

const emptyPoolData: PoolData = {
  junior: emptyTranche,
  // senior: emptyTranche,
  availableFunds: new BN(0),
  minJuniorRatio: new BN(0),
  currentJuniorRatio: new BN(0),
}
