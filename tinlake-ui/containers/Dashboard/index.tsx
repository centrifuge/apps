import { Spinner } from '@centrifuge/axis-spinner'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PoolList from '../../components/PoolList'
import PoolsMetrics from '../../components/PoolsMetrics'
import TinlakeExplainer from '../../components/TinlakeExplainer'
import { IpfsPools } from '../../config'
import { loadPools, loadPoolsDailyData, PoolsState } from '../../ducks/pools'

interface Props {
  ipfsPools: IpfsPools
  tinlake: ITinlake
}

const Dashboard: React.FC<Props> = (props: Props) => {
  const dispatch = useDispatch()
  const pools = useSelector<any, PoolsState>((state) => state.pools)

  React.useEffect(() => {
    dispatch(loadPools(props.ipfsPools))
    dispatch(loadPoolsDailyData())
  }, [])

  return (
    <Box>
      {!pools || pools.state === 'loading' ? (
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
      ) : (
        pools.data && (
          <Box basis={'full'}>
            <Box margin={{ top: 'large', bottom: 'none' }} direction="row">
              <TinlakeExplainer />
            </Box>
            <Box direction="row" gap="large" margin={{ bottom: 'medium', top: 'large' }} justify="center" wrap>
              <PoolsMetrics pools={pools.data} tinlake={props.tinlake} />
            </Box>
            <PoolList poolsData={pools.data} />
          </Box>
        )
      )}
      <Box pad={{ vertical: 'medium' }} />
    </Box>
  )
}

export default Dashboard
