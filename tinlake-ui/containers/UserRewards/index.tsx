import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
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
import { load, UserRewardsLink, UserRewardsState } from '../../ducks/userRewards'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { shortAddr } from '../../utils/shortAddr'
import { toPrecision } from '../../utils/toPrecision'
import CentChainWalletDialog from '../CentChainWalletDialog'
import CollectRewards from '../CollectRewards'
import SetCentAddress from '../SetCentAddress'

interface Props {
  tinlake: ITinlake
}

const UserRewards: React.FC<Props> = ({ tinlake }: Props) => {
  const userRewards = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
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

  const connect = () => dispatch(ensureAuthed())

  const data = userRewards.data

  return (
    <>
      <Heading level="5" margin={{ top: 'large' }}>
        RAD Rewards
      </Heading>

      <Box direction="row" align="start">
        {!ethAddr && (
          <Card>
            <Box pad="medium">
              <Head>Connect Your Wallet</Head>
              Please connect with your Ethereum Wallet to see your rewards.
              <Button primary label="Connect" margin={{ left: 'auto', top: 'large' }} onClick={connect} />
            </Box>
          </Card>
        )}

        {ethAddr && (
          <Box>
            <Box margin={{ top: 'medium' }} direction="row">
              <Box
                width="256px"
                pad="medium"
                elevation="small"
                round="xsmall"
                background="white"
                margin={{ right: '16px', bottom: 'large' }}
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
                <Label>Your Earned Rewards</Label>
              </Box>
            </Box>

            {data?.links && data.links.length === 0 && (
              <>
                {!(cWallet.state === 'connected' && cWallet.accounts.length === 1) && (
                  <Card>
                    <Box pad="medium">
                      <Head>Link Your Centrifuge Chain Account</Head>
                      Your RAD rewards are earned on Ethereum, but owned on Centrifuge Chain. Link your Ethereum address
                      to a Centrifuge Chain account to collect your rewards.
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
                      to a Centrifuge Chain account to collect your rewards.
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
                <Box direction="row" pad={{ horizontal: 'medium', top: 'medium', bottom: 'none' }}>
                  <Box flex={true}>
                    <Head>Collect Your Rewards</Head>

                    {debug && (
                      <Alert type="info">
                        <h3>Debug: Earnings</h3>
                        <ul></ul>
                        {data.links.map((c) => (
                          <li key={c.centAccountID}>
                            {shortAddr(accountIdToCentChainAddr(c.centAccountID))} has earned{' '}
                            {toPrecision(baseToDisplay(c.earned, 18), 4)} RAD (AccountID {shortAddr(c.centAccountID)},
                            claimable on Centrifuge Chain:{' '}
                            {c.claimable ? `${toPrecision(baseToDisplay(c.claimable, 18), 4)} RAD` : `[loading...]`},
                            claimed on Centrifuge Chain:{' '}
                            {c.claimed ? `${toPrecision(baseToDisplay(c.claimed, 18), 4)} RAD` : `[loading...]`})
                          </li>
                        ))}
                      </Alert>
                    )}

                    {!data?.claimable && (
                      <>
                        You can not yet collect your rewards, please come back{' '}
                        {comebackDate(data?.nonZeroInvestmentSince)}
                      </>
                    )}
                  </Box>
                  <RewardRecipients recipients={data?.links} />
                </Box>
                {(true || data?.claimable) && <CollectRewards />}
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
    margin={{ left: 'auto' }}
    width="360px"
    style={{ color: '#555555' }}
  >
    Investors can invest into this Tinlake pool through two tokens that are backed by collateral locked by the Asset
    Originator: TIN and DROP. Both tokens represent the liquidity deposited into Tinlake and accrue interest over time.
  </Box>
)

const RewardRecipients = ({ recipients }: { recipients: UserRewardsLink[] }) => (
  <RewardRecipientsCont>
    {recipients.reverse().map((r, i) => (
      <Recipient key={r.centAccountID}>
        <Addr active={i === 0}>{shortAddr(accountIdToCentChainAddr(r.centAccountID))}</Addr>
        <Status active={i === 0}>
          {i === 0 ? 'Active' : 'Inactive'} | {toPrecision(baseToDisplay(r.earned, 18), 0)} RAD
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
