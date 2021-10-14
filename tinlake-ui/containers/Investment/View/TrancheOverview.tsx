import { baseToDisplay, feeToInterestRate, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useQuery } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { Button } from '../../../components/Button'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Card } from '../../../components/Card'
import InvestAction from '../../../components/InvestAction'
import { Box, Shelf } from '../../../components/Layout'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { RewardsWarning } from '../../../components/RewardsWarning'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Tooltip } from '../../../components/Tooltip'
import { ValuePairList } from '../../../components/ValuePairList'
import config, { Pool } from '../../../config'
import { ensureAuthed } from '../../../ducks/auth'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { useTrancheYield } from '../../../utils/hooks'
import { secondsToHms } from '../../../utils/time'
import { toMaxPrecision, toPrecision } from '../../../utils/toPrecision'
import { useEpoch } from '../../../utils/useEpoch'
import { usePool } from '../../../utils/usePool'
import CollectCard from './CollectCard'
import { EyeIcon } from './EyeIcon'
import InvestCard from './InvestCard'
import OrderCard from './OrderCard'
import RedeemCard from './RedeemCard'
import { Info, MinTimeRemaining, Sidenote, TokenLogo, Warning } from './styles'

interface Props {
  pool?: Pool
  tranche: 'senior' | 'junior'
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
  const tinlake = useTinlake()
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)
  const { data: epochData } = useEpoch()
  const trancheData = props.tranche === 'senior' ? poolData?.senior : poolData?.junior

  const router = useRouter()

  const address = useSelector<any, string | null>((state) => state.auth.address)

  const {
    data: { balance, tokenPrice, disbursements, hasPendingOrder, hasPendingCollection } = {},
    refetch: refetchTrancheData,
  } = useTrancheData(tinlake, props.tranche, address)

  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [card, setCard] = React.useState<Card>('home')

  const isMaintainanceMode =
    props.pool && config.featureFlagMaintenanceMode.includes(props.pool.addresses.ROOT_CONTRACT)

  const isUpcoming = poolData?.isUpcoming
  const forumLink = Object.entries((props.pool?.metadata.attributes as any)?.Links ?? {}).find(([key]) =>
    /discussion/i.test(key)
  )?.[1] as string | undefined

  const value =
    balance && tokenPrice
      ? new BN(balance)
          .mul(new BN(tokenPrice))
          .div(new BN(10).pow(new BN(27)))
          .toString()
      : undefined

  const dispatch = useDispatch()

  const { dropYield } = useTrancheYield(tinlake.contractAddresses.ROOT_CONTRACT)

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

  const displayInWalletBtn = card === 'home' &&
    trancheData?.token &&
    trancheData.token.length > 0 &&
    trancheData.token.length < 7 && (
      <TextButton onClick={addToWallet}>
        <div>
          <EyeIcon /> Display in wallet
        </div>
      </TextButton>
    )

  const secondaryValues = (
    <Box mt="small">
      <Tooltip title="DROP tokens earn yield on the outstanding assets at the fixed DROP rate (APR). The current yield may deviate due to compounding effects or unused liquidity in the pool reserve. The current 30d DROP APY is the annualized return of the pool's DROP token over the last 30 days.">
        <ValuePairList
          variant="tertiary"
          items={
            [
              dropYield &&
                !(poolData?.netAssetValue.isZero() && poolData?.reserve.isZero()) && {
                  term: 'Current DROP yield (30d APY)',
                  value: dropYield,
                  valueUnit: '%',
                },
              {
                term: 'Fixed DROP rate (APR)',
                value: toPrecision(feeToInterestRate(trancheData?.interestRate || new BN(0)), 2),
                valueUnit: '%',
              },
              {
                term: 'Minimum investment amount',
                value: 5000,
                valueUnit: props.pool?.metadata.currencySymbol || 'DAI',
              },
            ].filter(Boolean) as any
          }
        />
      </Tooltip>
    </Box>
  )

  React.useEffect(() => {
    if (props.pool?.metadata && !props.pool.metadata.issuerEmail) {
      console.warn('The "issuerEmail" field is blank for pool ', props.pool.metadata.name)
    }
  }, [props.pool?.metadata])

  React.useEffect(() => {
    if (hasPendingCollection) setCard('collect')
    else if (hasPendingOrder) setCard('order')
    else if ('invest' in router.query && router.query.invest === props.tranche) setCard('invest')
    else setCard('home')
  }, [hasPendingCollection, hasPendingOrder, router.query])

  return (
    <Card p={24} height="100%" display="flex" flexDirection="column">
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
      {isMaintainanceMode && (
        <Warning>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Pool maintenance ongoing
          </Heading>
          Until this upgrade is finished, investments and redemptions are not possible for a short while. Please come
          back soon.
        </Warning>
      )}
      {!isMaintainanceMode && address && trancheData?.inMemberlist === true && (
        <>
          {card === 'home' && (
            <>
              {secondaryValues}
              {epochData?.isBlockedState && (
                <>
                  <Warning>
                    <BlackHeading>
                      <AlertIcon src="/static/help-circle.svg" />
                      Computing orders
                    </BlackHeading>
                    The Epoch has closed and orders are now executed. No new order can be submitted until the start of
                    the next Epoch.
                    {epochData?.minChallengePeriodEnd !== 0 && (
                      <MinTimeRemaining>
                        Minimum time remaining:{' '}
                        {secondsToHms(epochData.minChallengePeriodEnd + 60 - new Date().getTime() / 1000)}
                      </MinTimeRemaining>
                    )}
                  </Warning>
                  <BottomCardToolbar>{displayInWalletBtn}</BottomCardToolbar>
                </>
              )}
              {props.tranche === 'senior' && <RewardsWarning mt="medium" bleedX="medium" />}
              {!epochData?.isBlockedState && (
                <BottomCardToolbar>
                  <Box mt="small" display="flex" flex="1">
                    <ButtonGroup justifyContent="flex-end" flex="1" flexDirection={['column-reverse', 'row']}>
                      <Box display="flex" justifyContent="flex-start" flex="1">
                        {displayInWalletBtn}
                      </Box>
                      <Button
                        secondary
                        label="Redeem"
                        onClick={() => setCard('redeem')}
                        disabled={balance?.isZero() || epochData?.isBlockedState === true}
                      />
                      <Button
                        primary
                        label="Invest"
                        onClick={() => setCard('invest')}
                        disabled={epochData?.isBlockedState === true}
                      />
                    </ButtonGroup>
                  </Box>
                </BottomCardToolbar>
              )}
            </>
          )}
          {card === 'order' && (
            <OrderCard
              {...props}
              selectedPool={props.pool}
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
              setCard={setCard}
              updateTrancheData={refetchTrancheData}
            />
          )}
          {card === 'redeem' && (
            <RedeemCard {...props} selectedPool={props.pool} setCard={setCard} updateTrancheData={refetchTrancheData} />
          )}
        </>
      )}
      {props.pool &&
        !isMaintainanceMode &&
        props.tranche === 'senior' &&
        !trancheData?.inMemberlist &&
        (isUpcoming ? (
          <>
            {address && (
              <Info>
                <>
                  <Heading level="6" margin={{ bottom: 'xsmall' }}>
                    Interested in investing?
                  </Heading>
                  This upcoming pool is not open for investments yet.{' '}
                  {forumLink && (
                    <>
                      Please follow the{' '}
                      <DarkLink href={forumLink} target="_blank">
                        Forum
                      </DarkLink>{' '}
                      for announcements.
                    </>
                  )}
                  <ButtonGroup mt="small">
                    <InvestAction pool={props.pool} tranche="senior" />
                  </ButtonGroup>
                </>
              </Info>
            )}

            {!address && (
              <Info>
                <Heading level="6" margin={{ bottom: 'xsmall' }}>
                  Interested in investing?
                </Heading>
                Connect your wallet to start the process.
                <ButtonGroup mt="small">
                  <Button primary label="Connect" onClick={connect} />
                </ButtonGroup>
              </Info>
            )}
          </>
        ) : (
          <>
            {secondaryValues}
            <ButtonGroup mt="medium">
              <InvestAction pool={props.pool} tranche="senior" />
            </ButtonGroup>
          </>
        ))}

      {props.pool &&
        props.tranche === 'junior' &&
        !isMaintainanceMode &&
        (!trancheData?.inMemberlist || !address) &&
        props.pool.metadata.issuerEmail && (
          <Info>
            <Heading level="6" margin={{ bottom: 'xsmall' }}>
              Interested in investing?
            </Heading>
            TIN tokens usually have higher yet more volatile returns, limited liquidity and require a minimum investment
            amount of 50k DAI. If you are interested in investing in TIN, please{' '}
            <DarkLink href={`mailto:${props.pool.metadata.issuerEmail}`}>contact the issuer</DarkLink>.
          </Info>
        )}
    </Card>
  )
}

export default TrancheOverview

const TrancheNote = styled.div`
  color: #777;
`

const DarkLink = styled.a`
  color: #000;
`

const AlertIcon = styled.img`
  width: 16px;
  height: 16px;
  margin-right: 8px;
`

const BlackHeading = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #000;
`

const TextButton = styled.div`
  display: inline-block;

  > div {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 500;
    padding: 8px 0;
    white-space: nowrap;
    cursor: pointer;

    > svg {
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }
  }

  :hover {
    color: #2762ff;
  }
`

const BottomCardToolbar = styled.div`
  display: flex;
  flex: 1;
  align-items: flex-end;
  margin-top: ${(p) => p.theme.space.small}px;
`
