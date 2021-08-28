import { Spinner } from '@centrifuge/axis-spinner'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import * as React from 'react'
import PoolList from '../../components/PoolList'
import PoolsMetrics from '../../components/PoolsMetrics'
import TinlakeExplainer from '../../components/TinlakeExplainer'
import { IpfsPools } from '../../config'
import { usePools } from '../../utils/usePools'

interface Props {
  ipfsPools: IpfsPools
  tinlake: ITinlake
}

const Dashboard: React.FC<Props> = (props: Props) => {
  const pools = usePools()

  return (
    <Box>
      {!pools.data ? (
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
      ) : (
        <Box basis={'full'}>
          <Box margin={{ top: 'large', bottom: 'none' }} direction="row">
            <TinlakeExplainer />
          </Box>
          <Box direction="row" gap="large" margin={{ bottom: 'medium', top: 'large' }} justify="center" wrap>
            <PoolsMetrics totalValue={pools.data?.totalValue} tinlake={props.tinlake} />
          </Box>
          <PoolList poolsData={pools.data} />
        </Box>
      )}
      <Box pad={{ vertical: 'medium' }} />
    </Box>
  )
}

export default Dashboard
