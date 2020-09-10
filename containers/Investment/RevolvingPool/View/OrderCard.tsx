import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'

import { Description } from './styles'
import { Card } from './TrancheOverview'

interface Props {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
}

const OrderCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  return (
    <Box>
      <Heading level="6" margin={{ bottom: 'xsmall' }}>
        Pending [INVEST/REDEEM] Order for Epoch #NEXT
      </Heading>
      <Description>
        You have locked [TOKEN/DAI] to [INVEST/REDEEM] [into/from] Tinlake for the next epoch. You can cancel or update
        this order until the end of the current epoch.
      </Description>

      <Table margin={{ top: 'medium' }}>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Type of transaction</TableCell>
            <TableCell style={{ textAlign: 'end' }}>[Invest/Redeem]</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Amount {token} locked</TableCell>
            <TableCell style={{ textAlign: 'end' }}>12.333,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Locked value at current token price</TableCell>
            <TableCell style={{ textAlign: 'end' }}>1321,523.00 DAI</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button primary label="Cancel Order" />
        <Button primary label="Update Order" />
      </Box>
    </Box>
  )
}

export default OrderCard
