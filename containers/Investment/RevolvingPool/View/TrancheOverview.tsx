import * as React from 'react'
import { Box, Button, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'

import InvestCard from './InvestCard'
import RedeemCard from './RedeemCard'

interface Props {
  pool: Pool
  tranche: 'senior' | 'junior'
}

export type Card = 'home' | 'invest' | 'redeem' | 'order'

const TrancheOverview: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [card, setCard] = React.useState<Card>('home')

  return (
    <Box width="medium" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell scope="row">{token} Balance</TableCell>
            <TableCell style={{ textAlign: 'end' }}> 1,502.24 </TableCell>
          </TableRow>
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

      {card === 'invest' && <InvestCard {...props} setCard={setCard} />}
      {card === 'redeem' && <RedeemCard {...props} setCard={setCard} />}
    </Box>
  )
}

export default TrancheOverview
