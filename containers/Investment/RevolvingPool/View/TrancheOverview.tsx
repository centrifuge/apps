import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'

import InvestCard from './InvestCard'
import RedeemCard from './RedeemCard'
import OrderCard from './OrderCard'
import CollectCard from './CollectCard'
import { TokenLogo } from './styles'

interface Props {
  pool: Pool
  tranche: 'senior' | 'junior'
}

export type Card = 'home' | 'collect' | 'order' | 'invest' | 'redeem' | 'order'

const TrancheOverview: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [card, setCard] = React.useState<Card>('home')

  // TODO: these should be replaced by variables retrieved using tinlake.js
  const isPendingOrder = false
  const isPendingCollection = false

  React.useEffect(() => {
    if (isPendingOrder) setCard('order')
    else if (isPendingCollection) setCard('collect')
    else setCard('home')
  }, [isPendingCollection, isPendingOrder])

  return (
    <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
      <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
        <Heading level="5" margin={'0'}>
          <TokenLogo src={`../../../../static/${token}_final.svg`} />
          {token} Balance
        </Heading>
        <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
          1,502.24
        </Heading>
      </Box>

      <Table>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Current Price</TableCell>
            <TableCell style={{ textAlign: 'end' }}> 1.232 </TableCell>
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
      {card === 'order' && <OrderCard {...props} setCard={setCard} />}
      {card === 'collect' && <CollectCard {...props} setCard={setCard} />}
      {card === 'invest' && <InvestCard {...props} setCard={setCard} />}
      {card === 'redeem' && <RedeemCard {...props} setCard={setCard} />}
    </Box>
  )
}

export default TrancheOverview
