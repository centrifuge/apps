import { Spinner } from '@centrifuge/axis-spinner'
import { Box } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import InvestAction from '../../components/InvestAction/index'
import PoolList from '../../components/PoolList'
import PoolsMetrics from '../../components/PoolsMetrics'
import TinlakeExplainer from '../../components/TinlakeExplainer'
import { loadPools, PoolsState } from '../../ducks/pools'

interface Props {
  loadPools?: () => Promise<void>
  pools?: PoolsState
}

class Dashboard extends React.Component<Props> {
  componentDidMount() {
    const { loadPools } = this.props
    loadPools && loadPools()
  }

  render() {
    const { pools } = this.props

    return (
      <Box>
        {!pools || pools.state === 'loading' ? (
          <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
        ) : (
          pools.data && (
            <Box basis={'full'} style={{ backgroundColor: '#f9f9f9' }}>
              <Box margin={{ top: 'medium', bottom: 'none' }} direction="row">
                <TinlakeExplainer />
              </Box>
              <Box direction="row" gap="large" margin={{ bottom: 'large', top: 'medium' }} justify="center">
                <PoolsMetrics pools={pools.data} />
              </Box>
              <PoolList pools={pools.data.pools} />
              <Box style={{ borderBottom: '1px solid #bdbdbd' }} align="center" justify="center">
                <InvestAction />
              </Box>
            </Box>
          )
        )}
        <Box pad={{ vertical: 'medium' }}></Box>
      </Box>
    )
  }
}

export default connect((state) => state, { loadPools })(Dashboard)
