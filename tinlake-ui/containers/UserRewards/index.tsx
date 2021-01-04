import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingValue } from '../../components/LoadingValue'
import NumberDisplay from '../../components/NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from '../../components/PoolsMetrics/styles'
import { AuthState } from '../../ducks/auth'
import { loadUserRewards, UserRewardsState } from '../../ducks/userRewards'
import CentChainWallet from '../CentChainWallet'
import SetCentAddress from '../SetCentAddress'

interface Props {
  tinlake: ITinlake
}

const UserRewards: React.FC<Props> = ({ tinlake }: Props) => {
  const userRewards = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const dispatch = useDispatch()

  const auth = useSelector<any, AuthState>((state: any) => state.auth)
  const { address } = auth

  React.useEffect(() => {
    if (address) {
      dispatch(loadUserRewards(address))
    }
  }, [address])

  if (!address) {
    return (
      <Box margin={{ top: 'medium' }} direction="row">
        Please connect with your Ethereum Wallet to see user rewards
      </Box>
    )
  }

  const data = userRewards.ethData

  return (
    <>
      <h1>Your Rewards on Ethereum</h1>
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
              <LoadingValue
                done={userRewards?.ethState === 'found' && !!data}
                render={() => <NumberDisplay value={baseToDisplay(data!.totalRewards, 18)} precision={4} />}
              ></LoadingValue>
            </Value>{' '}
            <Unit>RAD</Unit>
          </Cont>
          <Label>Your Total Rewards</Label>
        </Box>
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
              <LoadingValue
                done={userRewards?.ethState === 'found' && !!data}
                render={() => <NumberDisplay value={baseToDisplay(data!.claimableRewards, 18)} precision={4} />}
              ></LoadingValue>
            </Value>{' '}
            <Unit>RAD</Unit>
          </Cont>
          <Label>Your Claimable Rewards</Label>
        </Box>
      </Box>
      <h1>Claim Your Rewards</h1>
      <h2>1. Connect Your Wallet</h2>
      <CentChainWallet tinlake={tinlake} />
      <h2>2. Set Your Centrifuge Chain Address</h2>
      {data?.claims.length === 0 && <SetCentAddress tinlake={tinlake} />}
      {data?.claims.length === 1 && (
        <div>
          Your Centrifuge Chain address is set to {data.claims[0].centAddress}, which has accumulated{' '}
          {data.claims[0].rewardsAccumulated} RAD
        </div>
      )}
      {data?.claims && data.claims.length > 1 && (
        <div>
          You have set multiple Centrifuge Chain addresses:
          {data.claims.map((c) => (
            <div>
              {c.centAddress} (has accumulated {c.rewardsAccumulated} RAD)
            </div>
          ))}
        </div>
      )}
      <h2>3. Collect Rewards on Centrifuge Chain</h2>
      {data?.claims && data.claims.length > 0 && !data?.eligible && (
        <div>You can not yet collect your rewards, please come back {comebackDate(data?.nonZeroBalanceSince)}</div>
      )}
      {data?.claims && data.claims.length > 0 && data?.eligible && (
        <div>
          You can collect your rewards:
          {/* TODO */}
        </div>
      )}
    </>
  )
}

export default UserRewards

const days = 24 * 60 * 60

function comebackDate(nonZero: string | null | undefined) {
  if (!nonZero || new BN(nonZero).isZero()) {
    return 'after investing in a Tinlake pool and waiting for 60 days.'
  }

  const start = new BN(nonZero)
  const startDate = new Date(start.toNumber() * 1000).toLocaleDateString()
  const target = start.addn(61 * days)
  const targetDate = new Date(target.toNumber() * 1000).toLocaleDateString()
  const diff = target
    .sub(new BN(Date.now() / 1000))
    .divn(1 * days)
    .addn(1)
    .toString()

  return `in ${
    diff === '1' ? '1 day' : diff + ' days'
  } on ${targetDate}. Your first eligible investment was made on ${startDate}.`
}
