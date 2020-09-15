import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'
import { baseToDisplay, ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'

import InvestCard from './InvestCard'
import RedeemCard from './RedeemCard'
import OrderCard from './OrderCard'
import CollectCard from './CollectCard'
import { TokenLogo } from './styles'

interface Props {
  pool: Pool
  tranche: 'senior' | 'junior'
  tinlake: ITinlakeV3
}

export type Card = 'home' | 'collect' | 'order' | 'invest' | 'redeem'

const TrancheOverview: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [card, setCard] = React.useState<Card>('home')

  const [balance, setBalance] = React.useState('0')
  const [tokenPrice, setTokenPrice] = React.useState('0')

  const [disbursements, setDisbursements] = React.useState<any>(undefined)
  const [hasPendingOrder, setHasPendingOrder] = React.useState(false)
  const [hasPendingCollection, setHasPendingCollection] = React.useState(false)

  React.useEffect(() => {
    async function getState() {
      const address = await props.tinlake.signer?.getAddress()
      if (address) {
        const balance =
          props.tranche === 'senior'
            ? await props.tinlake.getSeniorTokenBalance(address)
            : await props.tinlake.getJuniorTokenBalance(address)
        setBalance(balance.toString())

        console.log('balance', balance.toString())

        const tokenPrice =
          props.tranche === 'senior'
            ? await props.tinlake.getSeniorTokenPrice()
            : await props.tinlake.getJuniorTokenPrice()
        setBalance(tokenPrice.toString())

        const disbursements =
          props.tranche === 'senior'
            ? await props.tinlake.calcSeniorDisburse(address)
            : await props.tinlake.calcJuniorDisburse(address)
        console.log(`disbursements ${props.tranche}`, disbursements)
        setDisbursements(disbursements)
        setHasPendingOrder(!disbursements.remainingSupplyCurrency.add(disbursements.remainingRedeemToken).isZero())
        setHasPendingCollection(!disbursements.payoutCurrencyAmount.add(disbursements.payoutTokenAmount).isZero())
      }
    }

    getState()
  }, [props.tinlake])

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
              {addThousandsSeparators(toPrecision(baseToDisplay(tokenPrice, 18), 2))}{' '}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Your {token} Value</TableCell>
            <TableCell style={{ textAlign: 'end' }}>DAI 1321,523.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {card === 'home' && (
        <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
          <Button primary label="Redeem" onClick={() => setCard('redeem')} />
          <Button primary label="Invest" onClick={() => setCard('invest')} />
        </Box>
      )}
      {card === 'order' && (
        <OrderCard {...props} tinlake={props.tinlake} setCard={setCard} disbursements={disbursements} />
      )}
      {card === 'collect' && <CollectCard {...props} setCard={setCard} />}
      {card === 'invest' && <InvestCard {...props} setCard={setCard} />}
      {card === 'redeem' && <RedeemCard {...props} setCard={setCard} />}
    </Box>
  )
}

export default TrancheOverview
