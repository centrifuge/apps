import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import Alert from '../../components/Alert'
import { LoadingValue } from '../../components/LoadingValue'
import NumberDisplay from '../../components/NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from '../../components/PoolsMetrics/styles'
import { AuthState, ensureAuthed } from '../../ducks/auth'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { loadRewards, RewardsState } from '../../ducks/rewards'
import { load, UserRewardsLink, UserRewardsState } from '../../ducks/userRewards'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { shortAddr } from '../../utils/shortAddr'
import { dynamicPrecision, toDynamicPrecision } from '../../utils/toDynamicPrecision'
import { toPrecision } from '../../utils/toPrecision'
import CentChainWalletDialog from '../CentChainWalletDialog'
import ClaimRewards from '../ClaimRewards'
import SetCentAddress from '../SetCentAddress'

interface Props {
  tinlake: ITinlake
}

const UserRewards: React.FC<Props> = ({ tinlake }: Props) => {
  const userRewards = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const rewards = useSelector<any, RewardsState>((state: any) => state.rewards)
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const { address: ethAddr } = useSelector<any, AuthState>((state: any) => state.auth)
  const dispatch = useDispatch()
  React.useEffect(() => {
    dispatch(loadRewards())
  }, [])
  React.useEffect(() => {
    if (ethAddr) {
      dispatch(load(ethAddr))
    }
  }, [ethAddr])

  const {
    query: { debug },
  } = useRouter()

  const connect = () => dispatch(ensureAuthed())

  const data = userRewards.data

  return (
    <>
      <Heading level="5" margin={{ top: 'large' }}>
        RAD Rewards
      </Heading>

      <Box direction="row" align="start" justify="between">
        {!ethAddr && (
          <Box>
            <Box margin={{ top: 'medium' }} direction="row">
              <Box
                pad="medium"
                elevation="small"
                round="xsmall"
                background="white"
                margin={{ bottom: 'large' }}
                direction="row"
              >
                <Metric
                  loading={rewards?.state !== 'found' || !rewards.data}
                  value={baseToDisplay(new Decimal(rewards.data?.toDateRewardAggregateValue || '0').toFixed(0), 18)}
                  label="Total Rewards Earned Across All Investors"
                  token="RAD"
                  borderRight
                />
                <Metric
                  loading={rewards?.state !== 'found' || !rewards.data}
                  value={baseToDisplay(new Decimal(rewards.data?.todayReward || '0').toFixed(0), 18)}
                  label="Rewards Earned Today By All Investors"
                  token="RAD"
                />
              </Box>
            </Box>
            <Card>
              <Box pad="medium">
                <Head>Connect your Ethereum Account</Head>
                Please connect with the Ethereum Account that is holding your Tinlake investment to see your RAD
                rewards.
                <Button primary label="Connect" margin={{ left: 'auto', top: 'large' }} onClick={connect} />
              </Box>
            </Card>
          </Box>
        )}

        {ethAddr && (
          <Box>
            <Box margin={{ top: 'medium' }} direction="row">
              <Box
                pad="medium"
                elevation="small"
                round="xsmall"
                background="white"
                margin={{ bottom: 'large' }}
                direction="row"
              >
                <Metric
                  loading={userRewards?.subgraphState !== 'found' || !data}
                  value={baseToDisplay(data?.currentActiveInvestmentAmount || '0', 18)}
                  label="Your Current Investment Value"
                  token="DAI"
                  borderRight
                />
                <Metric
                  loading={
                    rewards?.state !== 'found' || !rewards.data || userRewards?.subgraphState !== 'found' || !data
                  }
                  value={baseToDisplay(
                    new Decimal(rewards.data?.rewardRate || '0')
                      .mul(data?.currentActiveInvestmentAmount || '0')
                      .toFixed(0),
                    18
                  )}
                  label="Your Daily Rewards"
                  token="RAD"
                  borderRight
                />
                <Metric
                  loading={userRewards?.subgraphState !== 'found' || !data}
                  value={baseToDisplay(new Decimal(data?.totalEarnedRewards || '0').toFixed(0), 18)}
                  label="Your Earned Rewards"
                  token="RAD"
                />
              </Box>
            </Box>

            {data?.links && data.links.length === 0 && (
              <>
                {!(cWallet.state === 'connected' && cWallet.accounts.length === 1) && (
                  <Card>
                    <Box pad="medium">
                      <Head>Link Your Centrifuge Chain Account</Head>
                      Your RAD Rewards are earned in Tinlake on Ethereum but claimed and held on Centrifuge Chain. Link
                      your ETH address to a Centrifuge Chain account to collet your rewards.
                      <br />
                      <br />
                      <CentChainWalletDialog />
                    </Box>
                  </Card>
                )}

                {cWallet.state === 'connected' && cWallet.accounts.length === 1 && (
                  <Card>
                    <Box pad="medium">
                      <Head>Link Your Centrifuge Chain Account</Head>
                      Your RAD rewards are earned on Ethereum, but owned on Centrifuge Chain. Link your Ethereum address
                      to a Centrifuge Chain account to claim your rewards.
                      <br />
                      <br />
                      <SetCentAddress tinlake={tinlake} />
                    </Box>
                  </Card>
                )}
              </>
            )}

            {data?.links && data.links.length > 0 && (
              <Card>
                <Box direction="row" pad={{ horizontal: 'medium', top: 'medium', bottom: 'medium' }}>
                  <Box flex={true}>
                    <Head>Claim Your RAD Rewards</Head>

                    {debug && (
                      <Alert type="info">
                        <h3>Debug: Earnings</h3>
                        <ul>
                          {data.links.map((c, i) => (
                            <li key={c.centAccountID}>
                              Link {i + 1} {i === data.links.length - 1 && '(Active)'}
                              <ul>
                                <li>
                                  Centrifuge Chain Address: {shortAddr(accountIdToCentChainAddr(c.centAccountID))}
                                </li>
                                <li>Centrifuge Chain Account ID: {shortAddr(c.centAccountID)}</li>
                                <li>Earned (from Subgraph): {toPrecision(baseToDisplay(c.earned, 18), 4)} RAD</li>
                                <li>
                                  Claimable (from GCP):{' '}
                                  {c.claimable
                                    ? `${toPrecision(baseToDisplay(c.claimable, 18), 4)} RAD`
                                    : `[loading...]`}
                                </li>
                                <li>
                                  Claimed (from Centrifuge Chain):{' '}
                                  {c.claimed ? `${toPrecision(baseToDisplay(c.claimed, 18), 4)} RAD` : `[loading...]`}
                                </li>
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </Alert>
                    )}

                    {!data?.claimable && comebackDate(data?.nonZeroInvestmentSince)}
                  </Box>
                  <RewardRecipients recipients={data?.links} />
                </Box>
                {data?.claimable && <ClaimRewards activeLink={data.links[data.links.length - 1]} />}
              </Card>
            )}
          </Box>
        )}

        <Explainer />
      </Box>
    </>
  )
}

export default UserRewards

const days = 24 * 60 * 60

function comebackDate(nonZero: string | null | undefined) {
  if (!nonZero || new BN(nonZero).isZero()) {
    return 'You can not yet claim your rewards, please come back after investing in a Tinlake pool and waiting for 60 days.'
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

  return `You have not been invested for the minimum holding period of 60 days and thus do not qualify for RAD rewards `
    + `yet. Your first eligible investment was made ${startDate} so you can return in ${
      diff === '1' ? '1 day' : diff + ' days'} on ${targetDate} to claim your RAD rewards.`

}

const Card = ({ children }: React.PropsWithChildren<{}>) => (
  <Box width="640px" pad="none" elevation="small" round="xsmall" background="white">
    {children}
  </Box>
)

const Head = ({ children }: React.PropsWithChildren<{}>) => (
  <Heading level="5" margin={{ top: 'xxsmall', bottom: 'small' }}>
    {children}
  </Heading>
)

const Explainer = () => (
  <Box
    background="#eee"
    pad="medium"
    round="xsmall"
    margin={{ left: '24px' }}
    width="360px"
    style={{ color: '#555555' }}
  >
    Radial (RAD) Rewards are earned based on your Tinlake investments and apply to all pools in Tinlake. They are
    calculated based on the total amount invested on a per day basis. You have to stay invested for at least 60 days to
    qualify for Rewards.
    <br />
    <br />
    Your Radial Rewards are earned in Tinlake on Etereum but claimed and held on Centrifuge Chain where RAD can be used
    to stake value and on-chain governance. Find more information about RAD here.
  </Box>
)

const RewardRecipients = ({ recipients }: { recipients: UserRewardsLink[] }) => (
  <RewardRecipientsCont>
    {recipients.reverse().map((r, i) => (
      <Recipient key={r.centAccountID}>
        <Addr active={i === 0}>{shortAddr(accountIdToCentChainAddr(r.centAccountID))}</Addr>
        <Status active={i === 0}>
          {i === 0 ? 'Active' : 'Inactive'} |{' '}
          {r.claimed ? `${toDynamicPrecision(baseToDisplay(r.claimed, 18))} RAD` : 'loading...'}
        </Status>
      </Recipient>
    ))}
  </RewardRecipientsCont>
)

const RewardRecipientsCont = styled.div`
  width: 100px;
  margin-left: 24px;
`

const Recipient = styled.div`
  margin-bottom: 12px;
`

const Addr = styled.div<{ active: boolean }>`
  font-size: 14px;
  font-weight: 500;
  height: 16px;
  line-height: 16px;
  color: ${({ active }) => (active ? '#000000' : '#d8d8d8')};
`

const Status = styled.div<{ active: boolean }>`
  font-size: 10px;
  font-weight: bold;
  height: 14px;
  line-height: 14px;
  color: ${({ active }) => (active ? '#2762ff' : '#d8d8d8')};
`

const Metric = ({
  token,
  loading,
  precision,
  value,
  label,
  borderRight,
}: {
  token: 'DAI' | 'RAD'
  loading?: boolean
  value: string
  precision?: number
  label: string
  borderRight?: boolean
}) => (
  <Box pad={{ horizontal: 'medium' }} style={{ borderRight: borderRight ? '1px solid #dadada' : undefined }}>
    <Cont>
      <TokenLogo src={{ DAI: `/static/dai.svg`, RAD: `/static/rad.svg` }[token]} />
      <Value>
        <LoadingValue
          done={!loading}
          render={() => (
            <NumberDisplay value={value} precision={precision || (token === 'RAD' ? dynamicPrecision(value) : 0)} />
          )}
        ></LoadingValue>
      </Value>{' '}
      <Unit>{{ DAI: 'DAI', RAD: 'RAD' }[token]}</Unit>
    </Cont>
    <Label>{label}</Label>
  </Box>
)
