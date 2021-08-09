import { baseToDisplay, feeToInterestRate, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import InvestAction from '../../../components/InvestAction'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { PoolLink } from '../../../components/PoolLink'
import { Tooltip } from '../../../components/Tooltip'
import config, { Pool } from '../../../config'
import { ensureAuthed } from '../../../ducks/auth'
import { loadPool, PoolState } from '../../../ducks/pool'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { useTrancheYield } from '../../../utils/hooks'
import { secondsToHms } from '../../../utils/time'
import { toMaxPrecision, toPrecision } from '../../../utils/toPrecision'
import CollectCard from './CollectCard'
import InvestCard from './InvestCard'
import OrderCard from './OrderCard'
import RedeemCard from './RedeemCard'
import { AddWalletLink, Info, MinTimeRemaining, Sidenote, TokenLogo, Warning } from './styles'

interface Props {
  pool?: Pool
  tranche: 'senior' | 'junior'
  tinlake: ITinlake
}

export type Card = 'home' | 'collect' | 'order' | 'invest' | 'redeem'

const TrancheOverview: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const trancheData = props.tranche === 'senior' ? pool?.data?.senior : pool?.data?.junior
  const epochData = pool?.epoch || undefined

  const router = useRouter()

  const address = useSelector<any, string | null>((state) => state.auth.address)

  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [card, setCard] = React.useState<Card>('home')

  React.useEffect(() => {
    if ('invest' in router.query && router.query.invest === props.tranche) {
      setCard('invest')
    }
  }, [router.query])

  const [balance, setBalance] = React.useState<string | undefined>(undefined)
  const [tokenPrice, setTokenPrice] = React.useState<string | undefined>(undefined)
  const value =
    balance && tokenPrice
      ? new BN(balance)
          .mul(new BN(tokenPrice))
          .div(new BN(10).pow(new BN(27)))
          .toString()
      : undefined

  const [disbursements, setDisbursements] = React.useState<any>(undefined)
  const [hasPendingOrder, setHasPendingOrder] = React.useState(false)
  const [hasPendingCollection, setHasPendingCollection] = React.useState(false)

  const dispatch = useDispatch()

  const { dropYield } = useTrancheYield()

  const connect = () => {
    dispatch(ensureAuthed())
  }

  // V3 TODO: this should probably move to actions and expose a single TrancheData object (or to a duck?)
  const updateTrancheData = async () => {
    dispatch(loadPool(props.tinlake, undefined, true))

    const tokenPrice =
      props.tranche === 'senior' ? await props.tinlake.getTokenPriceSenior() : await props.tinlake.getTokenPriceJunior()
    setTokenPrice(tokenPrice.toString())

    if (address) {
      const balance =
        props.tranche === 'senior'
          ? await props.tinlake.getSeniorTokenBalance(address)
          : await props.tinlake.getJuniorTokenBalance(address)
      setBalance(balance.toString())

      const disbursements =
        props.tranche === 'senior'
          ? await props.tinlake.calcSeniorDisburse(address)
          : await props.tinlake.calcJuniorDisburse(address)
      setDisbursements(disbursements)
      setHasPendingOrder(!disbursements.remainingSupplyCurrency.add(disbursements.remainingRedeemToken).isZero())
      setHasPendingCollection(!disbursements.payoutCurrencyAmount.add(disbursements.payoutTokenAmount).isZero())
    } else {
      setBalance('0')
    }
  }

  const addToWallet = async () => {
    if (!trancheData || !trancheData.address || !trancheData.token || !trancheData.decimals) return

    try {
      const fallback = `https://tinlake.centrifuge.io/static/${token}_final.svg`

      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: trancheData.address,
            symbol: trancheData.token,
            decimals: trancheData.decimals,
            image:
              token === 'DROP'
                ? props.pool?.metadata.media?.drop || fallback
                : props.pool?.metadata.media?.tin || fallback,
          },
        },
      })
    } catch (error) {
      console.log(error)
    }
  }

  React.useEffect(() => {
    updateTrancheData()
  }, [props.tinlake.signer, address])

  React.useEffect(() => {
    if (hasPendingCollection) setCard('collect')
    else if (hasPendingOrder) setCard('order')
    else setCard('home')
  }, [hasPendingCollection, hasPendingOrder])

  return (
    <Box
      pad="24px"
      elevation="small"
      round="xsmall"
      margin={{ bottom: 'medium' }}
      style={{ flex: '1 1 400px', maxWidth: '420px' }}
      background="white"
    >
      <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
        <Heading level="5" margin={'0'}>
          <TokenLogo src={`/static/${token}_final.svg`} />
          {token} Token
        </Heading>
      </Box>
      <Box margin={{ bottom: 'medium' }}>
        <TrancheNote>
          {props.tranche === 'senior' ? 'Senior tranche' : 'Junior tranche'} —{' '}
          {props.tranche === 'senior' ? 'Lower risk, stable return' : 'Higher risk, variable return'}
        </TrancheNote>
      </Box>
      <Table>
        <TableBody>
          {(!disbursements?.payoutTokenAmount || disbursements?.payoutTokenAmount.isZero()) && (
            <TableRow>
              <TableCell scope="row">Your balance</TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={balance !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(balance || '0', 18), 4))} {token}
                </LoadingValue>
              </TableCell>
            </TableRow>
          )}
          {disbursements?.payoutTokenAmount && !disbursements.payoutTokenAmount.isZero() && (
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
              >
                <span>Your balance</span>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                <LoadingValue done={balance !== undefined} height={39}>
                  <>
                    {addThousandsSeparators(toPrecision(baseToDisplay(balance || '0', 18), 4))} {token}
                    <Sidenote>
                      Uncollected:{' '}
                      {addThousandsSeparators(
                        toMaxPrecision(baseToDisplay(disbursements?.payoutTokenAmount || new BN(0), 18), 4)
                      )}{' '}
                      {token}
                    </Sidenote>
                  </>
                </LoadingValue>
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell scope="row">Current price</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              <LoadingValue done={tokenPrice !== undefined}>
                {addThousandsSeparators(toPrecision(baseToDisplay(tokenPrice || '0', 27), 4))}
              </LoadingValue>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row" border={{ color: 'transparent' }}>
              Current value
            </TableCell>
            <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
              <LoadingValue done={value !== undefined}>
                {addThousandsSeparators(toPrecision(baseToDisplay(value || '0', 18), 4))}{' '}
                {props.pool?.metadata.currencySymbol || 'DAI'}
              </LoadingValue>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {props.pool && config.featureFlagMaintenanceMode.includes(props.pool.addresses.ROOT_CONTRACT) && (
        <Warning>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Pool maintenance ongoing
          </Heading>
          Until this upgrade is finished, investments and redemptions are not possible for a short while. Please come
          back soon.
        </Warning>
      )}
      {!(props.pool && config.featureFlagMaintenanceMode.includes(props.pool.addresses.ROOT_CONTRACT)) &&
        address &&
        trancheData?.inMemberlist === true && (
          <>
            {card === 'home' && (
              <>
                {epochData?.isBlockedState && (
                  <Warning>
                    <Heading level="6" margin={{ bottom: 'xsmall' }}>
                      Computing orders
                    </Heading>
                    The Epoch has just been closed and the order executions are currently being computed. Until the next
                    Epoch opens, you cannot submit new orders.
                    {epochData?.minChallengePeriodEnd !== 0 && (
                      <MinTimeRemaining>
                        Minimum time remaining:{' '}
                        {secondsToHms(epochData.minChallengePeriodEnd + 60 - new Date().getTime() / 1000)}
                      </MinTimeRemaining>
                    )}
                  </Warning>
                )}

                {!epochData?.isBlockedState && (
                  <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
                    <Button
                      primary
                      label="Invest"
                      onClick={() => setCard('invest')}
                      disabled={epochData?.isBlockedState === true}
                    />
                    <Button
                      primary
                      label="Redeem"
                      onClick={() => setCard('redeem')}
                      disabled={balance === '0' || epochData?.isBlockedState === true}
                    />
                  </Box>
                )}
              </>
            )}
            {card === 'order' && (
              <OrderCard
                {...props}
                selectedPool={props.pool}
                tinlake={props.tinlake}
                setCard={setCard}
                disbursements={disbursements}
                tokenPrice={tokenPrice || '0'}
                updateTrancheData={updateTrancheData}
              />
            )}
            {card === 'collect' && (
              <CollectCard
                {...props}
                selectedPool={props.pool}
                setCard={setCard}
                disbursements={disbursements}
                tokenPrice={tokenPrice || '0'}
                updateTrancheData={updateTrancheData}
              />
            )}
            {card === 'invest' && (
              <InvestCard
                selectedPool={props.pool}
                tranche={props.tranche}
                tinlake={props.tinlake}
                setCard={setCard}
                updateTrancheData={updateTrancheData}
              />
            )}
            {card === 'redeem' && (
              <RedeemCard
                {...props}
                selectedPool={props.pool}
                setCard={setCard}
                updateTrancheData={updateTrancheData}
              />
            )}

            {card === 'home' && trancheData?.token && trancheData.token.length > 0 && trancheData.token.length < 7 && (
              <AddWalletLink onClick={addToWallet}>Display {trancheData?.token} in your wallet</AddWalletLink>
            )}
          </>
        )}
      {props.pool &&
        !config.featureFlagMaintenanceMode.includes(props.pool.addresses.ROOT_CONTRACT) &&
        props.tranche === 'senior' &&
        !trancheData?.inMemberlist &&
        ('onboard' in router.query ||
          ('addresses' in props.pool &&
            config.featureFlagNewOnboardingPools.includes(props.pool.addresses.ROOT_CONTRACT))) && (
          <>
            <Info>
              <Tooltip title="DROP tokens earn yield on the outstanding assets at the fixed DROP rate (APR). The current yield may deviate due to compounding effects or unused liquidity in the pool reserve. The current 30d DROP APY is the annualized return of the pool's DROP token over the last 30 days.">
                {dropYield && !(pool?.data?.netAssetValue.isZero() && pool?.data?.reserve.isZero()) && (
                  <>
                    Current DROP yield (30d APY): <b>{dropYield}%</b>
                    <br />
                  </>
                )}
                Fixed DROP rate (APR):{' '}
                <b>{toPrecision(feeToInterestRate(trancheData?.interestRate || new BN(0)), 2)}%</b>
                <br />
                Minimum investment amount: <b>5000 {props.pool?.metadata.currencySymbol || 'DAI'}</b>
              </Tooltip>
            </Info>
            <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
              <PoolLink href={'/onboarding'}>
                <Anchor>
                  <Button label="Invest" primary />
                </Anchor>
              </PoolLink>
            </Box>
          </>
        )}

      {props.pool &&
        !config.featureFlagMaintenanceMode.includes(props.pool.addresses.ROOT_CONTRACT) &&
        !(
          'onboard' in router.query ||
          ('addresses' in props.pool &&
            config.featureFlagNewOnboardingPools.includes(props.pool.addresses.ROOT_CONTRACT))
        ) &&
        !trancheData?.inMemberlist && (
          <>
            {address && (
              <Info>
                <>
                  <Heading level="6" margin={{ bottom: 'xsmall' }}>
                    Interested in investing?
                  </Heading>
                  If you want to learn more get started with your onboarding process.
                  <Box justify="end" margin={{ top: 'small' }}>
                    <InvestAction pool={props.pool} />
                  </Box>
                </>
              </Info>
            )}

            {!address && (
              <Info>
                <Heading level="6" margin={{ bottom: 'xsmall' }}>
                  Interested in investing?
                </Heading>
                Connect your wallet to start the process.
                <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
                  <Button primary label="Connect" onClick={connect} />
                </Box>
              </Info>
            )}
          </>
        )}
    </Box>
  )
}

export default TrancheOverview

const TrancheNote = styled.div`
  color: #777;
`
