import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'
import { baseToDisplay, ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import BN from 'bn.js'

import InvestCard from './InvestCard'
import RedeemCard from './RedeemCard'
import OrderCard from './OrderCard'
import CollectCard from './CollectCard'
import { TokenLogo, Warning } from './styles'
import InvestAction from '../../../../components/InvestAction'

interface Props {
  pool: Pool
  tranche: 'senior' | 'junior'
  tinlake: ITinlakeV3
}

export type Card = 'home' | 'collect' | 'order' | 'invest' | 'redeem'

const TrancheOverview: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [card, setCard] = React.useState<Card>('home')

  const [isInMemberlist] = React.useState<boolean | undefined>(true)

  const [balance, setBalance] = React.useState('0')
  const [tokenPrice, setTokenPrice] = React.useState('0')
  const value = new BN(balance)
    .div(new BN(10).pow(new BN(18)))
    .mul(new BN(tokenPrice).div(new BN(10).pow(new BN(27))))
    .toString()

  const [disbursements, setDisbursements] = React.useState<any>(undefined)
  const [hasPendingOrder, setHasPendingOrder] = React.useState(false)
  const [hasPendingCollection, setHasPendingCollection] = React.useState(false)

  React.useEffect(() => {
    async function getState() {
      const address = await props.tinlake.signer?.getAddress()
      if (address) {
        // const isInMemberlist =
        //   props.tranche === 'senior'
        //     ? await props.tinlake.checkSeniorTokenMemberlist(address)
        //     : await props.tinlake.checkJuniorTokenMemberlist(address)
        // setIsInMemberlist(true)

        const balance =
          props.tranche === 'senior'
            ? await props.tinlake.getSeniorTokenBalance(address)
            : await props.tinlake.getJuniorTokenBalance(address)
        setBalance(balance.toString())

        const tokenPrice =
          props.tranche === 'senior'
            ? await props.tinlake.getTokenPriceSenior()
            : await props.tinlake.getTokenPriceJunior()
        console.log('tokenPrice', tokenPrice.toString())
        setTokenPrice(tokenPrice.toString())

        const disbursements =
          props.tranche === 'senior'
            ? await props.tinlake.calcSeniorDisburse(address)
            : await props.tinlake.calcJuniorDisburse(address)
        console.log(`${props.tranche} disbursements`, disbursements)
        setDisbursements(disbursements)
        setHasPendingOrder(!disbursements.remainingSupplyCurrency.add(disbursements.remainingRedeemToken).isZero())
        setHasPendingCollection(!disbursements.payoutCurrencyAmount.add(disbursements.payoutTokenAmount).isZero())
      }
    }

    getState()
  }, [])

  React.useEffect(() => {
    if (hasPendingOrder) setCard('order')
    else if (hasPendingCollection) setCard('collect')
    else setCard('home')
  }, [hasPendingCollection, hasPendingOrder])

  return (
    <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
      <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
        <Heading level="5" margin={'0'}>
          <TokenLogo src={`../../../../static/${token}_final.svg`} />
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
              {' '}
              {addThousandsSeparators(toPrecision(baseToDisplay(tokenPrice, 27), 2))}{' '}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Your {token} Value</TableCell>
            <TableCell style={{ textAlign: 'end' }}>DAI {addThousandsSeparators(toPrecision(value, 2))} </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {isInMemberlist && (
        <>
          {card === 'home' && (
            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button primary label="Redeem" onClick={() => setCard('redeem')} />
              <Button primary label="Invest" onClick={() => setCard('invest')} />
            </Box>
          )}
          {card === 'order' && (
            <OrderCard
              {...props}
              tinlake={props.tinlake}
              setCard={setCard}
              disbursements={disbursements}
              tokenPrice={tokenPrice}
            />
          )}
          {card === 'collect' && <CollectCard {...props} setCard={setCard} disbursements={disbursements} />}
          {card === 'invest' && <InvestCard {...props} setCard={setCard} />}
          {card === 'redeem' && <RedeemCard {...props} setCard={setCard} />}
        </>
      )}

      {!isInMemberlist && (
        <Warning>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Not allowed
          </Heading>
          You are not allowed to invest in the {props.tranche} tranche of {props.pool.name}.
          <Box justify="end" margin={{ top: 'small' }}>
            <InvestAction poolName={props.pool.name} />
          </Box>
        </Warning>
      )}
    </Box>
  )
}

export default TrancheOverview
