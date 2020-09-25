import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'
import { baseToDisplay, ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import BN from 'bn.js'
import { EpochData } from './index'
import { useDispatch, useSelector } from 'react-redux'
import { loadPool } from '../../../../ducks/pool'

import InvestCard from './InvestCard'
import RedeemCard from './RedeemCard'
import OrderCard from './OrderCard'
import CollectCard from './CollectCard'
import { TokenLogo, Info } from './styles'
import InvestAction from '../../../../components/InvestAction'
import { useInterval } from '../../../../utils/hooks'

interface Props {
  pool: Pool
  epochData: EpochData | undefined
  tranche: 'senior' | 'junior'
  tinlake: ITinlakeV3
}

export type Card = 'home' | 'collect' | 'order' | 'invest' | 'redeem'

const TrancheOverview: React.FC<Props> = (props: Props) => {
  const address = useSelector<any, string | null>((state) => state.auth.address)

  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [card, setCard] = React.useState<Card>('home')

  const [isInMemberlist, setIsInMemberlist] = React.useState<boolean | undefined>(undefined)

  const [balance, setBalance] = React.useState('0')
  const [tokenPrice, setTokenPrice] = React.useState('0')
  const value = new BN(balance)
    .mul(new BN(tokenPrice))
    .div(new BN(10).pow(new BN(27)))
    .toString()

  const [disbursements, setDisbursements] = React.useState<any>(undefined)
  const [hasPendingOrder, setHasPendingOrder] = React.useState(false)
  const [hasPendingCollection, setHasPendingCollection] = React.useState(false)

  const dispatch = useDispatch()

  // V3 TODO: this should probably move to actions and expose a single TrancheData object (or to a duck?)
  const updateTrancheData = async () => {
    dispatch(loadPool(props.tinlake))

    if (address) {
      const isInMemberlist =
        props.tranche === 'senior'
          ? await props.tinlake.checkSeniorTokenMemberlist(address)
          : await props.tinlake.checkJuniorTokenMemberlist(address)
      setIsInMemberlist(isInMemberlist)

      const balance =
        props.tranche === 'senior'
          ? await props.tinlake.getSeniorTokenBalance(address)
          : await props.tinlake.getJuniorTokenBalance(address)
      setBalance(balance.toString())

      const tokenPrice =
        props.tranche === 'senior'
          ? await props.tinlake.getTokenPriceSenior()
          : await props.tinlake.getTokenPriceJunior()
      setTokenPrice(tokenPrice.toString())

      const disbursements =
        props.tranche === 'senior'
          ? await props.tinlake.calcSeniorDisburse(address)
          : await props.tinlake.calcJuniorDisburse(address)
      setDisbursements(disbursements)
      setHasPendingOrder(!disbursements.remainingSupplyCurrency.add(disbursements.remainingRedeemToken).isZero())
      setHasPendingCollection(!disbursements.payoutCurrencyAmount.add(disbursements.payoutTokenAmount).isZero())
    }
  }

  useInterval(() => {
    updateTrancheData()
  }, 10000)

  React.useEffect(() => {
    updateTrancheData()
  }, [props.tinlake.signer, address])

  React.useEffect(() => {
    if (hasPendingCollection) setCard('collect')
    else if (hasPendingOrder) setCard('order')
    else setCard('home')
  }, [hasPendingCollection, hasPendingOrder])

  return (
    <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
      <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
        <Heading level="5" margin={'0'}>
          <TokenLogo src={`/static/${token}_final.svg`} />
          {token} Balance
        </Heading>
        <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
          {addThousandsSeparators(toPrecision(baseToDisplay(balance, 18), 2))}
        </Heading>
      </Box>

      <Table>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Current Price</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {addThousandsSeparators(toPrecision(baseToDisplay(tokenPrice, 27), 2))}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row" border={{ color: 'transparent' }}>
              Your {token} Value
            </TableCell>
            <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
              {addThousandsSeparators(toPrecision(baseToDisplay(value, 18), 2))} DAI
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {isInMemberlist === true && (
        <>
          {card === 'home' && (
            <>
              {props.epochData?.isBlockedState && (
                <Info>
                  <Heading level="6" margin={{ bottom: 'xsmall' }}>
                    Computing orders
                  </Heading>
                  The Epoch has just been closed and the order executions are currently being computed. Until the next
                  Epoch opens, you cannot submit new orders.
                </Info>
              )}

              <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
                <Button
                  primary
                  label="Redeem"
                  onClick={() => setCard('redeem')}
                  disabled={balance === '0' || props.epochData?.isBlockedState}
                />
                <Button
                  primary
                  label="Invest"
                  onClick={() => setCard('invest')}
                  disabled={props.epochData?.isBlockedState}
                />
              </Box>
            </>
          )}
          {card === 'order' && (
            <OrderCard
              {...props}
              tinlake={props.tinlake}
              setCard={setCard}
              disbursements={disbursements}
              tokenPrice={tokenPrice}
              updateTrancheData={updateTrancheData}
              epochData={props.epochData}
            />
          )}
          {card === 'collect' && (
            <CollectCard
              {...props}
              setCard={setCard}
              disbursements={disbursements}
              tokenPrice={tokenPrice}
              updateTrancheData={updateTrancheData}
            />
          )}
          {card === 'invest' && <InvestCard {...props} setCard={setCard} updateTrancheData={updateTrancheData} />}
          {card === 'redeem' && <RedeemCard {...props} setCard={setCard} updateTrancheData={updateTrancheData} />}
        </>
      )}

      {isInMemberlist === false && (
        <Info>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Interested in investing?
          </Heading>
          If you want to learn more get started with your onboarding process.
          <Box justify="end" margin={{ top: 'small' }}>
            <InvestAction poolName={props.pool.name} />
          </Box>
        </Info>
      )}
    </Box>
  )
}

export default TrancheOverview
