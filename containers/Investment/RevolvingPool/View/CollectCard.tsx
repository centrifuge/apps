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

const CollectCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  return (
    <Box>
      <Heading level="6" margin={{ bottom: 'xsmall' }}>
        {token} available for collection
      </Heading>
      <Description>Your TOKEN [INVEST/REDEEM] order has been executed in Epoch #.</Description>

      <Table margin={{ top: 'medium' }}>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Type of transaction</TableCell>
            <TableCell style={{ textAlign: 'end' }}>[Invest/Redeem] {token}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Order amount</TableCell>
            <TableCell style={{ textAlign: 'end' }}>12.333,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Settled amount</TableCell>
            <TableCell style={{ textAlign: 'end' }}>12.333,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Settled token price</TableCell>
            <TableCell style={{ textAlign: 'end' }}>1.232</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Transaction value</TableCell>
            <TableCell style={{ textAlign: 'end' }}>1321,523.00 DAI</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button primary label="Collect" />
      </Box>
    </Box>
  )
}

export default CollectCard
