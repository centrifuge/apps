import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingValue } from '../../components/LoadingValue'
import NumberDisplay from '../../components/NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from '../../components/PoolsMetrics/styles'
import { AuthState } from '../../ducks/auth'
import { loadCentAddr, loadClaimsTree, loadUserRewards, UserRewardsState } from '../../ducks/userRewards'
import { shortAddr } from '../../utils/shortAddr'
import { toPrecision } from '../../utils/toPrecision'
import CentChainWallet from '../CentChainWallet'
import SetCentAddress from '../SetCentAddress'

interface Props {
  tinlake: ITinlake
}

const UserRewards: React.FC<Props> = ({ tinlake }: Props) => {
  const userRewards = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const dispatch = useDispatch()

  const { ethCentAddrState, ethCentAddr } = useSelector<any, UserRewardsState>((state: any) => state.userRewards)

  const { address: ethAddr } = useSelector<any, AuthState>((state: any) => state.auth)

  React.useEffect(() => {
    if (ethAddr) {
      dispatch(loadCentAddr(ethAddr, tinlake))
      dispatch(loadUserRewards(ethAddr))
      dispatch(loadClaimsTree())
    }
  }, [ethAddr])

  if (!ethAddr) {
    return (
      <Box margin={{ top: 'medium' }} direction="row">
        Please connect with your Ethereum Wallet to see user rewards
      </Box>
    )
  }

  const ethRewData = userRewards.ethData
  const centRewData = userRewards.centData

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
                done={userRewards?.ethState === 'found' && !!ethRewData}
                render={() => <NumberDisplay value={baseToDisplay(ethRewData!.totalRewards, 18)} precision={4} />}
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
                done={userRewards?.ethState === 'found' && !!ethRewData}
                render={() => <NumberDisplay value={baseToDisplay(ethRewData!.linkableRewards, 18)} precision={4} />}
              ></LoadingValue>
            </Value>{' '}
            <Unit>RAD</Unit>
          </Cont>
          <Label>Your Linkable Rewards</Label>
        </Box>
      </Box>
      <h1>Claim Your Rewards</h1>
      <h2>1. Connect Your Wallet</h2>
      <CentChainWallet />
      <h2>2. Set Your Centrifuge Chain Address</h2>
      {ethRewData?.links.length === 0 &&
        ((ethCentAddrState === 'loading' && 'Your Centrifuge Chain address: loading') ||
          (ethCentAddrState === 'empty' && <SetCentAddress tinlake={tinlake} />) ||
          (ethCentAddrState === 'found' && (
            <div>
              Your Centrifuge Chain address has been set to {ethCentAddr}. The information will automatically be relayed
              to Centrifuge Chain.
              {ethRewData.claimable && 'Please come back tomorrow to collect your rewards.'}
            </div>
          )))}
      {ethRewData?.links.length === 1 && (
        <div>
          Your Centrifuge Chain address is set to {ethRewData.links[0].centAddress}, which has accumulated{' '}
          {ethRewData.links[0].rewardsAccumulated} RAD
        </div>
      )}
      {ethRewData?.links && ethRewData.links.length > 1 && (
        <div>
          You have set multiple Centrifuge Chain addresses:
          {ethRewData.links.map((c) => (
            <div key={c.centAddress}>
              {shortAddr(c.centAddress)} (has earned on Ethereum{' '}
              {toPrecision(baseToDisplay(c.rewardsAccumulated, 18), 4)} RAD,{' '}
              {centRewData === null
                ? 'loading data from Centrifuge Chain...'
                : `has claimed on Centrifuge Chain: ${toPrecision(
                    baseToDisplay(centRewData.find((d) => d.accountID === c.centAccountId)?.claimed || '0', 18),
                    4
                  )} RAD)`}
            </div>
          ))}
        </div>
      )}
      <h2>3. Collect Rewards on Centrifuge Chain</h2>
      {!ethRewData?.claimable && (
        <div>
          You can not yet collect your rewards, please come back {comebackDate(ethRewData?.nonZeroBalanceSince)}
        </div>
      )}
      {ethRewData?.claimable && (!ethRewData?.links || ethRewData.links.length === 0) && (
        <div>You can collect your rewards, please finish step 2 above</div>
      )}
      {ethRewData?.claimable && ethRewData.links && ethRewData.links.length > 0 && (
        <div>
          You can collect your rewards: TODO
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
