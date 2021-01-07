import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingValue } from '../../components/LoadingValue'
import NumberDisplay from '../../components/NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from '../../components/PoolsMetrics/styles'
import { AuthState } from '../../ducks/auth'
import { load, UserRewardsState } from '../../ducks/userRewards'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
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

  // const { ethCentAddrState, ethCentAddr } = useSelector<any, UserRewardsState>((state: any) => state.userRewards)

  const { address: ethAddr } = useSelector<any, AuthState>((state: any) => state.auth)

  React.useEffect(() => {
    if (ethAddr) {
      dispatch(load(ethAddr))
    }
  }, [ethAddr])

  if (!ethAddr) {
    return (
      <Box margin={{ top: 'medium' }} direction="row">
        Please connect with your Ethereum Wallet to see user rewards
      </Box>
    )
  }

  const data = userRewards.data

  console.log('data', data)

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
                done={userRewards?.subgraphState === 'found' && !!data}
                render={() => <NumberDisplay value={baseToDisplay(data!.totalEarnedRewards, 18)} precision={4} />}
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
                done={userRewards?.subgraphState === 'found' && !!data}
                render={() => <NumberDisplay value={baseToDisplay(data!.unlinkedRewards, 18)} precision={4} />}
              ></LoadingValue>
            </Value>{' '}
            <Unit>RAD</Unit>
          </Cont>
          <Label>Your Unlinked Rewards</Label>
        </Box>
      </Box>
      <h1>Claim Your Rewards</h1>
      <h2>1. Connect Your Wallet</h2>
      <CentChainWallet />
      <h2>2. Set Your Centrifuge Chain Address</h2>
      {data?.links?.length === 0 && <SetCentAddress tinlake={tinlake} />}
      {data?.links?.length === 1 && (
        <div>
          Your Centrifuge Chain address is set to {shortAddr(accountIdToCentChainAddr(data.links[0].centAccountID))}{' '}
          (AccountID {shortAddr(data.links[0].centAccountID)}), which has earned on Ethereum{' '}
          {toPrecision(baseToDisplay(data.links[0].earned, 18), 4)} RAD
          {data.links[0].claimable
            ? `, of which ${toPrecision(
                baseToDisplay(data.links[0].claimable, 18),
                4
              )} RAD are claimable on Centrifuge Chain`
            : ` [claimable on Centrifuge Chain loading...]`}
          {data.links[0].claimed
            ? `, of which ${toPrecision(
                baseToDisplay(data.links[0].claimed, 18),
                4
              )} RAD have been claimed on Centrifuge Chain`
            : ` [claimed on Centrifuge Chain loading...]`}
        </div>
      )}
      {data?.links && data.links.length > 1 && (
        <div>
          You have set multiple Centrifuge Chain addresses:
          {data.links.map((c) => (
            <div key={c.centAccountID}>
              {shortAddr(accountIdToCentChainAddr(c.centAccountID))} (AccountID {shortAddr(c.centAccountID)}, has earned
              on Ethereum {toPrecision(baseToDisplay(c.earned, 18), 4)} RAD
              {c.claimable
                ? `, of which ${toPrecision(baseToDisplay(c.claimable, 18), 4)} RAD are claimable on Centrifuge Chain`
                : ` [claimable on Centrifuge Chain loading...]`}
              {c.claimed
                ? `, of which ${toPrecision(baseToDisplay(c.claimed, 18), 4)} RAD have been claimed on Centrifuge Chain`
                : ` [claimed on Centrifuge Chain loading...]`}
              )
            </div>
          ))}
        </div>
      )}
      <h2>3. Collect Rewards on Centrifuge Chain</h2>
      {!data?.claimable && (
        <div>You can not yet collect your rewards, please come back {comebackDate(data?.nonZeroInvestmentSince)}</div>
      )}
      {data?.claimable && data.links.length === 0 && (
        <div>You can collect your rewards, please finish step 2 above</div>
      )}
      {data?.claimable && data.links.length > 0 && (
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
