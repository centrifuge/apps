import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box } from 'grommet'
import { useRouter } from 'next/router'
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
import CollectRewards from '../CollectRewards'
import SetCentAddress from '../SetCentAddress'

interface Props {
  tinlake: ITinlake
}

const UserRewards: React.FC<Props> = ({ tinlake }: Props) => {
  const userRewards = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const dispatch = useDispatch()

  const { address: ethAddr } = useSelector<any, AuthState>((state: any) => state.auth)

  React.useEffect(() => {
    if (ethAddr) {
      dispatch(load(ethAddr))
    }
  }, [ethAddr])

  const {
    query: { debug },
  } = useRouter()

  if (!ethAddr) {
    return (
      <div>
        <h1>Your Rewards</h1>
        <Box margin={{ top: 'medium' }} direction="row">
          Please connect with your Ethereum Wallet to see your rewards.
        </Box>
      </div>
    )
  }

  const data = userRewards.data

  return (
    <div>
      <h1>Your Rewards</h1>
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
          <Label>Rewards You Earned So Far</Label>
        </Box>
      </Box>
      <h1>Collect Your Rewards</h1>
      Collect your rewards on Centrifuge Chain.
      <h2>1. Set Rewards Recipient</h2>
      {data?.links?.length === 0 && (
        <>
          <CentChainWallet />
          <SetCentAddress tinlake={tinlake} />
        </>
      )}
      {data?.links?.length === 1 && (
        <div>
          Centrifuge Chain address {shortAddr(accountIdToCentChainAddr(data.links[0].centAccountID))} has been set as
          rewards recipient.
          {debug && (
            <>
              {' '}
              (AccountID {shortAddr(data.links[0].centAccountID)}, earned on Ethereum:{' '}
              {toPrecision(baseToDisplay(data.links[0].earned, 18), 4)} RAD, claimable on Centrifuge Chain:
              {data.links[0].claimable
                ? `${toPrecision(baseToDisplay(data.links[0].claimable, 18), 4)} RAD`
                : `[loading...]`}
              , claimed on Centrifuge Chain:{' '}
              {data.links[0].claimed
                ? `${toPrecision(baseToDisplay(data.links[0].claimed, 18), 4)} RAD`
                : `[loading...]`}
              )
            </>
          )}
        </div>
      )}
      {data?.links && data.links.length > 1 && (
        <div>
          Multiple Centrifuge Chain addresses have been set as rewards recipients. The last one is active and will
          receive future rewards:
          {data.links.map((c) => (
            <div key={c.centAccountID}>
              {shortAddr(accountIdToCentChainAddr(c.centAccountID))} has earned{' '}
              {toPrecision(baseToDisplay(c.earned, 18), 4)} RAD
              {debug && (
                <>
                  {' '}
                  (AccountID {shortAddr(c.centAccountID)}, claimable on Centrifuge Chain:{' '}
                  {c.claimable ? `${toPrecision(baseToDisplay(c.claimable, 18), 4)} RAD` : `[loading...]`}, claimed on
                  Centrifuge Chain: {c.claimed ? `${toPrecision(baseToDisplay(c.claimed, 18), 4)} RAD` : `[loading...]`}
                  )
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <h2>2. Collect Your Rewards on Centrifuge Chain</h2>
      {!data?.claimable && (
        <div>You can not yet collect your rewards, please come back {comebackDate(data?.nonZeroInvestmentSince)}.</div>
      )}
      {data?.claimable && data.links.length === 0 && (
        <div>You can collect your rewards, please set your reward recipient above.</div>
      )}
      {data?.claimable && data.links.length > 0 && (
        <>
          <CentChainWallet />
          <CollectRewards />
        </>
      )}
    </div>
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
