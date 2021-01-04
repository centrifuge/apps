import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingValue } from '../../components/LoadingValue'
import NumberDisplay from '../../components/NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from '../../components/PoolsMetrics/styles'
import { loadRewards, RewardsState } from '../../ducks/rewards'

interface Props {}

const Rewards: React.FC<Props> = (_: Props) => {
  const rewards = useSelector<any, RewardsState>((state: any) => state.rewards)
  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(loadRewards())
  }, [])

  return (
    <Box margin={{ top: 'medium' }} direction="row">
      <Box
        width="256px"
        pad="medium"
        elevation="small"
        round="xsmall"
        background="white"
        margin={{ horizontal: '16px' }}
      >
        <Cont>
          <TokenLogo src={`/static/rad.svg`} />
          <Value>
            <LoadingValue done={rewards?.state === 'found' && !!rewards.data?.toDateAggregateValue}>
              <NumberDisplay value={baseToDisplay(rewards.data?.toDateAggregateValue || '', 18)} precision={0} />
            </LoadingValue>
          </Value>{' '}
          <Unit>RAD</Unit>
        </Cont>
        <Label>Total Rewards Across Users</Label>
      </Box>
      <Box pad={{ vertical: 'medium' }} />
    </Box>
  )
}

export default Rewards
