import * as React from 'react'
import { Box, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'

interface Props {
  pool: Pool
}

const PoolOverview: React.FC<Props> = () => {
  return (
    <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
      <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
        <Heading level="5" margin={'0'}>
          Pool Value
        </Heading>
        <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
          DAI 1,502.24
        </Heading>
      </Box>

      <Table>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Current NAV</TableCell>
            <TableCell style={{ textAlign: 'end' }}>DAI 20,500</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Current Reserve</TableCell>
            <TableCell style={{ textAlign: 'end' }}>DAI 20,500</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Heading level="5" margin={{ bottom: 'small' }}>
        Assets
      </Heading>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Outstanding Volume</TableCell>
            <TableCell style={{ textAlign: 'end' }}>DAI 1,000.510</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">DROP APR</TableCell>
            <TableCell style={{ textAlign: 'end' }}>10.50%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  )
}

export default PoolOverview
