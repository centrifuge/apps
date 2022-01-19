import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { useDebugFlags } from '../../components/DebugFlags'
import { LabeledValue } from '../../components/LabeledValue'
import { Shelf } from '../../components/Layout'
import { LoadingValue } from '../../components/LoadingValue'
import NumberDisplay from '../../components/NumberDisplay'
import PageTitle from '../../components/PageTitle'
import { ensureAuthed, useAuth } from '../../ducks/auth'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { shortAddr } from '../../utils/shortAddr'
import { dynamicPrecision, toDynamicPrecision } from '../../utils/toDynamicPrecision'
import { toPrecision } from '../../utils/toPrecision'
import { useGlobalRewards } from '../../utils/useGlobalRewards'
import { Tranche, usePortfolio } from '../../utils/usePortfolio'
import { UserRewardsData, UserRewardsLink, useUserRewards } from '../../utils/useUserRewards'
import CentChainWalletDialog from '../CentChainWalletDialog'
import ClaimRewards from '../ClaimRewards'
import SetCentAccount from '../SetCentAccount'

const UserRewards: React.FC = () => {
  const { data: userRewards } = useUserRewards()
  const rewards = useGlobalRewards()
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const { address: ethAddr } = useAuth()
  const portfolio = usePortfolio()
  const portfolioValue = portfolio.data?.totalValue
  const portfolioTinValue = portfolio.data?.tokenBalances
    ?.filter((tb) => tb.tranche === Tranche.junior)
    .reduce((sum, tb) => tb.value.add(sum), new BN(0))
  const portfolioDropValue = portfolio.data?.tokenBalances
    ?.filter((tb) => tb.tranche === Tranche.senior)
    .reduce((sum, tb) => tb.value.add(sum), new BN(0))

  // console.log(portfolio.data?.tokenBalances?.filter((tb) => tb.tranche === Tranche.senior))
  // console.log(portfolioValue?.toString())
  // console.log(portfolioDropValue?.toString())
  // console.log(portfolioTinValue?.toString())

  const dispatch = useDispatch()
  const router = useRouter()

  const [showLink, setShowLink] = React.useState(!!router.query.link)

  const { showRewardsInfo } = useDebugFlags()

  const connect = () => dispatch(ensureAuthed())

  return (
    <Box margin={{ top: 'medium' }}>
      <PageTitle page="Claim Your CFG Rewards" return />

      <Box direction="row" align="start" justify="between" wrap>
        <ColLeft flex>
          {ethAddr && (
            <Shelf
              as={Card}
              rowGap="medium"
              flexDirection={['column', 'row']}
              p="medium"
              mb="large"
              justifyContent="center"
            >
              <Metric
                loading={!userRewards || !portfolioValue}
                value={baseToDisplay(portfolioValue || '0', 18)}
                label="Your Investment"
                token="DAI"
                borderRight
              />
              <Metric
                loading={!rewards.data || !userRewards || !portfolioValue}
                value={baseToDisplay(
                  rewards.data?.dropRewardRate
                    ?.mul(portfolioDropValue?.toString() || 0)
                    .add(rewards.data?.tinRewardRate?.mul(portfolioTinValue?.toString() || 0))
                    .toFixed(0) || '0',
                  18
                )}
                label="Your Daily Rewards"
                token="CFG"
                borderRight
              />
              <Metric
                loading={!userRewards}
                value={baseToDisplay(userRewards?.totalEarnedRewards || '0', 18)}
                label="Your Earned Rewards"
                token="CFG"
              />
            </Shelf>
          )}

          {!ethAddr && (
            <Card>
              <Box pad="medium">
                <Head>Connect your Ethereum Account</Head>
                Please connect with the Ethereum Account holding your Tinlake investment to claim your CFG rewards.
                <Button primary label="Connect" margin={{ left: 'auto', top: 'large' }} onClick={connect} />
              </Box>
            </Card>
          )}

          {ethAddr &&
            userRewards?.links &&
            userRewards.links.length === 0 &&
            (userRewards?.totalEarnedRewards?.isZero() && !showLink ? (
              <Card>
                <Box pad="medium">
                  <Head>Start Investing to Earn Rewards</Head>
                  You don’t have any active Tinlake investments. To start earning CFG rewards, start investing in
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
                      <SetCentAccount />
                    </Box>
                  </Card>
                )}
              </>
            ))}

          {showRewardsInfo && (
            <Box margin={{ bottom: 'large' }} round="xsmall" background="neutral-3">
              <Box pad="medium">
                <h3>Debug:</h3>
                <ul>
                  <li>Non-zero investment since: {userRewards?.nonZeroInvestmentSince?.toString() || 'null'}</li>
                  <li>
                    Total earned rewards:{' '}
                    {userRewards ? `${toPrecision(baseToDisplay(userRewards?.totalEarnedRewards, 18), 4)} CFG` : 'null'}
                  </li>
                  <li>
                    Unlinked rewards:{' '}
                    {userRewards ? `${toPrecision(baseToDisplay(userRewards?.unlinkedRewards, 18), 4)} CFG` : 'null'}
                  </li>
                  {userRewards?.links.map((c, i) => (
                    <li key={c.centAccountID}>
                      Link {i + 1} {i === userRewards.links.length - 1 && '(Active)'}
                      <ul>
                        <li>Centrifuge Chain Address: {accountIdToCentChainAddr(c.centAccountID)}</li>
                        <li>Centrifuge Chain Account ID: {c.centAccountID}</li>
                        <li>Earned (from Subgraph): {toPrecision(baseToDisplay(c.earned, 18), 4)} CFG</li>
                        <li>
                          Claimable (from GCP):{' '}
                          {c.claimable ? `${toPrecision(baseToDisplay(c.claimable, 18), 4)} CFG` : `[loading...]`}
                        </li>
                        <li>
                          Claimed (from Centrifuge Chain):{' '}
                          {c.claimed ? `${toPrecision(baseToDisplay(c.claimed, 18), 4)} CFG` : `[loading...]`}
                        </li>
                      </ul>
                    </li>
                  ))}
                </ul>
              </Box>
            </Box>
          )}

          {ethAddr && userRewards?.links && userRewards.links.length > 0 && (
            <Card>
              <Box direction="row" pad={{ horizontal: 'medium', top: 'medium', bottom: 'medium' }}>
                <Box flex={true}>
                  <Head>Claim Your CFG Rewards</Head>

                  {comebackDate(userRewards?.nonZeroInvestmentSince)}
                </Box>
                <RewardRecipients recipients={userRewards?.links} />
              </Box>
              {showClaimStripe(userRewards) && (
                <ClaimRewards
                  activeLink={userRewards.links[userRewards.links.length - 1]}
                  portfolioValue={portfolioValue}
                />
              )}
            </Card>
          )}
        </ColLeft>
        <ColRight margin={{ left: 'xlarge' }}>
          <Card mb="large">
            <Box direction="row" background="#FCBA59" style={{ borderRadius: '6px 6px 0 0' }} pad={'14px 24px'}>
              <TokenLogoBig src="/static/cfg-white.svg" />
              <h3 style={{ margin: 0 }}>System-wide Rewards</h3>
            </Box>
            <MetricRow
              loading={!rewards.data}
              value={baseToDisplay(rewards.data?.todayReward || '0', 18)}
              label="Rewards Earned Today"
              token="CFG"
              borderBottom
            />
            <MetricRow
              loading={!rewards.data}
              value={rewards.data?.dropRewardRate.mul(10000).toFixed(4) || ''}
              label="Daily DROP Reward Rate"
              token="CFG"
              suffix={<span style={{ fontSize: 10, color: '#777777' }}> / 10k DAI</span>}
              borderBottom
            />
            <MetricRow
              loading={!rewards.data}
              value={rewards.data?.tinRewardRate.mul(10000).toFixed(4) || ''}
              label="Daily TIN Reward Rate"
              token="CFG"
              suffix={<span style={{ fontSize: 10, color: '#777777' }}> / 10k DAI</span>}
              borderBottom
            />
            <MetricRow
              loading={!rewards.data}
              value={baseToDisplay(rewards.data?.toDateRewardAggregateValue || new BN(0), 18)}
              label="Investor Rewards"
              token="CFG"
              borderBottom
            />
            <MetricRow
              loading={!rewards.data}
              value={baseToDisplay(rewards.data?.toDateAORewardAggregateValue || new BN(0), 18)}
              label="Asset Originator Rewards"
              token="CFG"
              borderBottom
            />
            <MetricRow
              loading={!rewards.data}
              value={baseToDisplay(
                (rewards.data?.toDateRewardAggregateValue || new BN(0)).add(
                  rewards.data?.toDateAORewardAggregateValue || new BN(0)
                ),
                18
              )}
              label="Total Rewards Earned"
              token="CFG"
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
    `You cannot claim your CFG rewards yet. CFG rewards can only be claimed after a minimum investment period of 30 ` +
    `days. Your first eligible investment was made ${startDate}. Please come back in ${
      diff.eqn(1) ? '1 day' : `${diff.toString()} days`
    } on ${targetDate} to claim your CFG rewards.`
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

const Head = ({ children }: React.PropsWithChildren<{}>) => (
  <Heading level="5" margin={{ top: 'xxsmall', bottom: 'small' }}>
    {children}
  </Heading>
)

const ColLeft = styled(Box)`
  flex: 1 1 600px;
`
const ColRight = styled(Box)`
  flex: 1 1 250px;
  @media (max-width: 899px) {
    margin: 32px 0 0;
  }
`

const Explainer = () => (
  <Box background="#eee" pad="medium" round="xsmall" style={{ color: '#555555' }}>
    <Box direction="row" pad={'0 0 14px'}>
      <HelpIcon src="/static/help-circle.svg" />
      <h3 style={{ margin: 0 }}>How it works</h3>
    </Box>
    CFG rewards are earned on Ethereum based on your Tinlake investments but claimed on Centrifuge Chain. To claim your
    rewards you need to link your Tinlake investment account to a Centrifuge Chain account receiving and holding your
    CFG.
    <br />
    <br />
    <Anchor
      href="https://medium.com/centrifuge/start-earning-radial-rad-rewards-for-tinlake-cbd98fcd8330"
      target="_blank"
    >
      How are CFG rewards calculated?
    </Anchor>
    <Anchor href="https://docs.centrifuge.io/build/cent-chain/" target="_blank">
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
              ? `Claimed ${addThousandsSeparators(toDynamicPrecision(baseToDisplay(r.claimed, 18)))} CFG`
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
  token: 'DAI' | 'CFG'
  loading?: boolean
  value: string
  precision?: number
  label: string
  borderRight?: boolean
}) => {
  return (
    <Box pad={{ horizontal: 'medium' }} style={{ borderRight: borderRight ? '1px solid #f2f2f2' : undefined }}>
      <LabeledValue
        variant="large"
        icon={{ DAI: `/static/dai.svg`, CFG: `/static/cfg-white.svg` }[token]}
        value={
          loading ? null : (
            <NumberDisplay value={value} precision={precision || (token === 'CFG' ? dynamicPrecision(value) : 0)} />
          )
        }
        unit={{ DAI: 'DAI', CFG: 'CFG' }[token]}
        label={label}
      />
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
  token: 'DAI' | 'CFG'
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
            <NumberDisplay value={value} precision={precision || (token === 'CFG' ? dynamicPrecision(value) : 0)} />
          )}
        ></LoadingValue>{' '}
        {{ DAI: 'DAI', CFG: 'CFG' }[token]}
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
