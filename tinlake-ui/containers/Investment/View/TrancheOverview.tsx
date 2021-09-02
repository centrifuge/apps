import { baseToDisplay, feeToInterestRate, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useQuery } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../../components/Card'
import InvestAction from '../../../components/InvestAction'
import { Box, Flex, Shelf } from '../../../components/Layout'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { PoolLink } from '../../../components/PoolLink'
import { Tooltip } from '../../../components/Tooltip'
import config, { Pool } from '../../../config'
import { ensureAuthed } from '../../../ducks/auth'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { useTrancheYield } from '../../../utils/hooks'
import { secondsToHms } from '../../../utils/time'
import { toMaxPrecision, toPrecision } from '../../../utils/toPrecision'
import { useEpoch } from '../../../utils/useEpoch'
import { usePool } from '../../../utils/usePool'
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

function useTrancheData(tinlake: ITinlake, tranche: 'senior' | 'junior', address?: string | null) {
  return useQuery(['trancheData', tinlake.contractAddresses.ROOT_CONTRACT, tranche, address], async () => {
    const tokenPrice = (
      tranche === 'senior' ? await tinlake.getTokenPriceSenior() : await tinlake.getTokenPriceJunior()
    ).toString()

    if (address) {
      const balance =
        tranche === 'senior'
          ? await tinlake.getSeniorTokenBalance(address)
          : await tinlake.getJuniorTokenBalance(address)

      const disbursements =
        tranche === 'senior' ? await tinlake.calcSeniorDisburse(address) : await tinlake.calcJuniorDisburse(address)

      return {
        tokenPrice,
        balance,
        disbursements,
        hasPendingOrder: !disbursements.remainingSupplyCurrency.add(disbursements.remainingRedeemToken).isZero(),
        hasPendingCollection: !disbursements.payoutCurrencyAmount.add(disbursements.payoutTokenAmount).isZero(),
      }
    }
    return {
      tokenPrice,
      balance: new BN(0),
      disbursements: undefined,
      hasPendingOrder: false,
      hasPendingCollection: false,
    }
  })
}

const TrancheOverview: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)
  const { data: epochData } = useEpoch(props.tinlake.contractAddresses.ROOT_CONTRACT)
  const trancheData = props.tranche === 'senior' ? poolData?.senior : poolData?.junior

  const router = useRouter()

  const address = useSelector<any, string | null>((state) => state.auth.address)

  const {
    data: { balance, tokenPrice, disbursements, hasPendingOrder, hasPendingCollection } = {},
    refetch: refetchTrancheData,
  } = useTrancheData(props.tinlake, props.tranche, address)

  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [card, setCard] = React.useState<Card>('home')

  React.useEffect(() => {
    if ('invest' in router.query && router.query.invest === props.tranche) {
      setCard('invest')
    }
  }, [router.query])

  const value =
    balance && tokenPrice
      ? new BN(balance)
          .mul(new BN(tokenPrice))
          .div(new BN(10).pow(new BN(27)))
          .toString()
      : undefined

  const dispatch = useDispatch()

  const { dropYield } = useTrancheYield(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const connect = () => {
    dispatch(ensureAuthed())
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
    if (hasPendingCollection) setCard('collect')
    else if (hasPendingOrder) setCard('order')
    else setCard('home')
  }, [hasPendingCollection, hasPendingOrder])

  return (
    <Card p={24}>
      <Shelf gap="xsmall" mb="xsmall">
        <TokenLogo src={`/static/${token}_final.svg`} />
        <Heading level="5" margin={'0'}>
          {token} Token
        </Heading>
      </Shelf>
      <Box mb="medium">
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
                  <Shelf gap="small" justifyContent="flex-end" mt="small">
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
                      disabled={balance?.isZero() || epochData?.isBlockedState === true}
                    />
                  </Shelf>
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
                updateTrancheData={refetchTrancheData}
              />
            )}
            {card === 'collect' && (
              <CollectCard
                {...props}
                selectedPool={props.pool}
                setCard={setCard}
                disbursements={disbursements}
                tokenPrice={tokenPrice || '0'}
                updateTrancheData={refetchTrancheData}
              />
            )}
            {card === 'invest' && (
              <InvestCard
                selectedPool={props.pool}
                tranche={props.tranche}
                tinlake={props.tinlake}
                setCard={setCard}
                updateTrancheData={refetchTrancheData}
              />
            )}
            {card === 'redeem' && (
              <RedeemCard
                {...props}
                selectedPool={props.pool}
                setCard={setCard}
                updateTrancheData={refetchTrancheData}
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
                {dropYield && !(poolData?.netAssetValue.isZero() && poolData?.reserve.isZero()) && (
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
            <Flex justifyContent={['center', 'flex-end']} mt="medium">
              <PoolLink href={'/onboarding'}>
                <Anchor>
                  <Button as="span" label="Invest" primary />
                </Anchor>
              </PoolLink>
            </Flex>
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
                  <Flex justifyContent={['center', 'flex-end']} mt="small">
                    <InvestAction pool={props.pool} />
                  </Flex>
                </>
              </Info>
            )}

            {!address && (
              <Info>
                <Heading level="6" margin={{ bottom: 'xsmall' }}>
                  Interested in investing?
                </Heading>
                Connect your wallet to start the process.
                <Flex justifyContent={['center', 'flex-end']} mt="small">
                  <Button primary label="Connect" onClick={connect} />
                </Flex>
              </Info>
            )}
          </>
        )}
    </Card>
  )
}

export default TrancheOverview

const TrancheNote = styled.div`
  color: #777;
`
