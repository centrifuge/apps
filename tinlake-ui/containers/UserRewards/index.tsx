import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { LoadingValue } from '../../components/LoadingValue'
import NumberDisplay from '../../components/NumberDisplay'
import PageTitle from '../../components/PageTitle'
import { Cont, Label, TokenLogo, Unit, Value } from '../../components/PoolsMetrics/styles'
import { AuthState, ensureAuthed } from '../../ducks/auth'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { PortfolioState } from '../../ducks/portfolio'
import { maybeLoadRewards, RewardsState } from '../../ducks/rewards'
import { maybeLoadUserRewards, UserRewardsData, UserRewardsLink, UserRewardsState } from '../../ducks/userRewards'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { shortAddr } from '../../utils/shortAddr'
import { dynamicPrecision, toDynamicPrecision } from '../../utils/toDynamicPrecision'
import { toPrecision } from '../../utils/toPrecision'
import CentChainWalletDialog from '../CentChainWalletDialog'
import ClaimRewards from '../ClaimRewards'
import SetCentAccount from '../SetCentAccount'

interface Props {
  tinlake: ITinlake
}

const UserRewards: React.FC<Props> = ({ tinlake }: Props) => {
  const userRewards = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const { totalValue: portfolioValue } = useSelector<any, PortfolioState>((state) => state.portfolio)
  const rewards = useSelector<any, RewardsState>((state: any) => state.rewards)
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const { address: ethAddr } = useSelector<any, AuthState>((state: any) => state.auth)
  const dispatch = useDispatch()
  React.useEffect(() => {
    dispatch(maybeLoadRewards())
  }, [])
  React.useEffect(() => {
    if (ethAddr) {
      dispatch(maybeLoadUserRewards(ethAddr))
    }
  }, [ethAddr])
  const [showLink, setShowLink] = React.useState(false)
  const router = useRouter()

  const {
    query: { debug },
  } = useRouter()

  const connect = () => dispatch(ensureAuthed())

  const data = userRewards.data

  return (
    <Box margin={{ top: 'medium' }}>
      <PageTitle page="Claim Your RAD Rewards" return />

      <Box direction="row" align="start" justify="between">
        <Box flex>
          {ethAddr && (
            <Box
              pad="medium"
              elevation="small"
              round="xsmall"
              background="white"
              margin={{ bottom: 'large' }}
              direction="row"
              justify="center"
            >
              <Metric
                loading={!data || !portfolioValue}
                value={baseToDisplay(portfolioValue || '0', 18)}
                label="Your Investment"
                token="DAI"
                borderRight
              />
              <Metric
                loading={!rewards.data || !data || !portfolioValue}
                value={baseToDisplay(
                  rewards.data?.rewardRate?.mul(portfolioValue?.toString() || 0).toFixed(0) || '0',
                  18
                )}
                label="Your Daily Rewards"
                token="RAD"
                borderRight
              />
              <Metric
                loading={!data}
                value={baseToDisplay(data?.totalEarnedRewards || '0', 18)}
                label="Your Earned Rewards"
                token="RAD"
              />
            </Box>
          )}

          {!ethAddr && (
            <Card>
              <Box pad="medium">
                <Head>Connect your Ethereum Account</Head>
                Please connect with the Ethereum Account holding your Tinlake investment to claim your RAD rewards.
                <Button primary label="Connect" margin={{ left: 'auto', top: 'large' }} onClick={connect} />
              </Box>
            </Card>
          )}

          {ethAddr &&
            data?.links &&
            data.links.length === 0 &&
            (data?.totalEarnedRewards?.isZero() && !showLink ? (
              <Card>
                <Box pad="medium">
                  <Head>Start Investing to Earn Rewards</Head>
                  You don’t have any active Tinlake investments. To start earning RAD rewards, start investing in
                  Tinlake now.
                  <br />
                  <br />
                  <Anchor onClick={() => setShowLink(true)} style={{ fontSize: 11 }}>
                    Link Centrifuge Chain account
                  </Anchor>
                  <Button
                    label="Explore Pools"
                    primary
                    onClick={() => router.push('/')}
                    margin={{ left: 'auto', top: 'medium' }}
                  />
                </Box>
              </Card>
            ) : (
              <>
                {!(cWallet.state === 'connected' && cWallet.accounts.length >= 1) && (
                  <Card>
                    <Box pad="medium">
                      <Head>Link Your Centrifuge Chain Account</Head>
                      <CentChainWalletDialog />
                    </Box>
                  </Card>
                )}

                {cWallet.state === 'connected' && cWallet.accounts.length >= 1 && (
                  <Card>
                    <Box pad="medium">
                      <Head>Link Your Centrifuge Chain Account</Head>
                      <SetCentAccount tinlake={tinlake} />
                    </Box>
                  </Card>
                )}
              </>
            ))}

          {debug && (
            <Card margin={{ bottom: 'large' }} background="neutral-3">
              <Box pad="medium">
                <h3>Debug:</h3>
                <ul>
                  <li>Non-zero investment since: {data?.nonZeroInvestmentSince?.toString() || 'null'}</li>
                  <li>
                    Total earned rewards:{' '}
                    {data ? `${toPrecision(baseToDisplay(data?.totalEarnedRewards, 18), 4)} RAD` : 'null'}
                  </li>
                  <li>
                    Unlinked rewards:{' '}
                    {data ? `${toPrecision(baseToDisplay(data?.unlinkedRewards, 18), 4)} RAD` : 'null'}
                  </li>
                  {data?.links.map((c, i) => (
                    <li key={c.centAccountID}>
                      Link {i + 1} {i === data.links.length - 1 && '(Active)'}
                      <ul>
                        <li>Centrifuge Chain Address: {accountIdToCentChainAddr(c.centAccountID)}</li>
                        <li>Centrifuge Chain Account ID: {c.centAccountID}</li>
                        <li>Earned (from Subgraph): {toPrecision(baseToDisplay(c.earned, 18), 4)} RAD</li>
                        <li>
                          Claimable (from GCP):{' '}
                          {c.claimable ? `${toPrecision(baseToDisplay(c.claimable, 18), 4)} RAD` : `[loading...]`}
                        </li>
                        <li>
                          Claimed (from Centrifuge Chain):{' '}
                          {c.claimed ? `${toPrecision(baseToDisplay(c.claimed, 18), 4)} RAD` : `[loading...]`}
                        </li>
                      </ul>
                    </li>
                  ))}
                </ul>
              </Box>
            </Card>
          )}

          {ethAddr && data?.links && data.links.length > 0 && (
            <Card>
              <Box direction="row" pad={{ horizontal: 'medium', top: 'medium', bottom: 'medium' }}>
                <Box flex={true}>
                  <Head>Claim Your RAD Rewards</Head>

                  {comebackDate(data?.nonZeroInvestmentSince)}
                </Box>
                <RewardRecipients recipients={data?.links} />
              </Box>
              {showClaimStripe(data) && <ClaimRewards activeLink={data.links[data.links.length - 1]} />}
            </Card>
          )}
        </Box>
        <ColRight>
          <Card margin={{ bottom: 'large' }}>
            <Box direction="row" background="#FCBA59" style={{ borderRadius: '6px 6px 0 0' }} pad={'14px 24px'}>
              <TokenLogoBig src="/static/rad-black.svg" />
              <h3 style={{ margin: 0 }}>System-wide Rewards</h3>
            </Box>
            <MetricRow
              loading={!rewards.data}
              value={baseToDisplay(rewards.data?.todayReward || '0', 18)}
              label="Rewards Earned Today"
              token="RAD"
              borderBottom
            />
            <MetricRow
              loading={!rewards.data}
              value={rewards.data?.rewardRate.mul(10000).toFixed(0) || ''}
              label="Daily Reward Rate"
              token="RAD"
              suffix={<span style={{ fontSize: 10, color: '#777777' }}> / 10k DAI</span>}
              borderBottom
            />
            <MetricRow
              loading={!rewards.data}
              value={baseToDisplay(rewards.data?.toDateRewardAggregateValue || '0', 18)}
              label="Total Rewards Earned"
              token="RAD"
            />
          </Card>

          <Explainer />
        </ColRight>
      </Box>
    </Box>
  )
}

export default UserRewards

const day = 24 * 60 * 60
const minNonZeroDays = 31

function comebackDate(nonZero: BN | null | undefined): null | string {
  if (!nonZero || nonZero.isZero()) {
    return 'You can not yet claim your rewards, please come back after investing in a Tinlake pool and waiting for 30 days.'
  }

  const start = nonZero
  const startDate = new Date(start.toNumber() * 1000).toLocaleDateString()
  const target = start.addn(minNonZeroDays * day)
  const targetDate = new Date(target.toNumber() * 1000).toLocaleDateString()
  const diff = target
    .sub(new BN(Date.now() / 1000))
    .divn(1 * day)
    .addn(1)

  // if not in the future
  if (diff.lten(0)) {
    return null
  }

  return (
    `You cannot claim your RAD rewards yet. RAD rewards can only be claimed after a minimum investment period of 30 ` +
    `days. Your first eligible investment was made ${startDate}. Please come back in ${
      diff.eqn(1) ? '1 day' : `${diff.toString()} days`
    } on ${targetDate} to claim your RAD rewards.`
  )
}

function showClaimStripe(data: UserRewardsData | null): boolean {
  if (data === null) {
    return false
  }

  const { links } = data

  // `false` if there are no links
  if (links.length === 0) {
    return false
  }

  const lastLink = links[links.length - 1]

  // `true` if last link has positive total rewards. That might still imply that there are no unclaimed rewards, but the
  // claim stripe handles that.
  if (lastLink.earned.gtn(0)) {
    return true
  }

  // `true` if last link has positive claimable rewards. Claimable could be positive even if earned is zero in cases where one Centrifuge Chain account receives rewards from multiple Ethereum accounts.
  if (lastLink.claimable?.gtn(0)) {
    return true
  }

  // `true` if last link has positive claimed rewards. Claimed could be positive even if earned is zero in cases where one Centrifuge Chain account receives rewards from multiple Ethereum accounts.
  if (lastLink.claimed?.gtn(0)) {
    return true
  }

  return false
}

const Card = ({ children, ...rest }: React.PropsWithChildren<any>) => (
  <Box width="100%" pad="none" elevation="small" round="xsmall" background="white" {...rest}>
    {children}
  </Box>
)

const Head = ({ children }: React.PropsWithChildren<{}>) => (
  <Heading level="5" margin={{ top: 'xxsmall', bottom: 'small' }}>
    {children}
  </Heading>
)

const ColRight = ({ children }: React.PropsWithChildren<{}>) => (
  <Box margin={{ left: 'xlarge' }} width="360px">
    {children}
  </Box>
)

const Explainer = () => (
  <Box background="#eee" pad="medium" round="xsmall" style={{ color: '#555555' }}>
    <Box direction="row" pad={'0 0 14px'}>
      <HelpIcon src="/static/help-circle.svg" />
      <h3 style={{ margin: 0 }}>How it works</h3>
    </Box>
    Radial (RAD) Rewards are earned on Ethereum based on your Tinlake investments but claimed on Centrifuge Chain. To
    claim your rewards you need to link your Tinlake investment account to a Centrifuge Chain account receiving and
    holding your RAD.
    <br />
    <br />
    <Anchor
      href="https://medium.com/centrifuge/start-earning-radial-rad-rewards-for-tinlake-cbd98fcd8330"
      target="_blank"
    >
      How are RAD rewards calculated?
    </Anchor>
    <Anchor href="https://centrifuge.io/products/chain/" target="_blank">
      What is Centrifuge Chain?
    </Anchor>
  </Box>
)

const RewardRecipients = ({ recipients }: { recipients: UserRewardsLink[] }) => (
  <RewardRecipientsCont>
    {recipients
      .map((r, i) => (
        <Recipient key={r.centAccountID}>
          <Addr active={i === recipients.length - 1}>{shortAddr(accountIdToCentChainAddr(r.centAccountID))}</Addr>
          <Status active={i === recipients.length - 1}>
            {recipients.length > 1 && (i === recipients.length - 1 ? 'Active | ' : 'Inactive | ')}
            {r.claimed
              ? `Claimed ${addThousandsSeparators(toDynamicPrecision(baseToDisplay(r.claimed, 18)))} RAD`
              : 'loading...'}
          </Status>
        </Recipient>
      ))
      .reverse()}
  </RewardRecipientsCont>
)

const RewardRecipientsCont = styled.div`
  width: 130px;
  margin-left: 24px;
`

const Recipient = styled.div`
  margin-bottom: 12px;
`

const Addr = styled.div<{ active: boolean }>`
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  height: 16px;
  line-height: 16px;
  color: ${({ active }) => (active ? '#000000' : '#d8d8d8')};
`

const Status = styled.div<{ active: boolean }>`
  text-align: right;
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
}) => {
  console.log('showing metric for', label, value, precision)
  return (
    <Box pad={{ horizontal: 'medium' }} style={{ borderRight: borderRight ? '1px solid #f2f2f2' : undefined }}>
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
}

const TokenLogoBig = styled.img`
  margin: 0 20px 0 0;
  width: 24px;
  height: 24px;
`

const MetricRow = ({
  token,
  loading,
  precision,
  value,
  label,
  borderBottom,
  suffix,
}: {
  token: 'DAI' | 'RAD'
  loading?: boolean
  value: string
  precision?: number
  label: string
  borderBottom?: boolean
  suffix?: React.ReactNode
}) => (
  <Box
    margin={{ horizontal: 'medium' }}
    pad={{ vertical: 'small' }}
    style={{ borderBottom: borderBottom ? '1px solid #f2f2f2' : undefined }}
    direction="row"
    justify="between"
  >
    <Box>{label}</Box>
    <Box direction="row">
      <div style={{ fontWeight: 500 }}>
        <LoadingValue
          done={!loading}
          maxWidth={60}
          alignRight
          render={() => (
            <NumberDisplay value={value} precision={precision || (token === 'RAD' ? dynamicPrecision(value) : 0)} />
          )}
        ></LoadingValue>{' '}
        {{ DAI: 'DAI', RAD: 'RAD' }[token]}
        {suffix}
      </div>
    </Box>
  </Box>
)

const HelpIcon = styled.img`
  margin: 0 20px 0 0;
  width: 24px;
  height: 24px;
`
