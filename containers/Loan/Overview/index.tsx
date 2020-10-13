import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { connect } from 'react-redux'

import { SignIcon } from './styles'
import { AuthState } from '../../../ducks/auth'
import { PoolLink } from '../../../components/PoolLink'
import { Pool } from '../../../config'

interface Props {
  activePool?: Pool
  tinlake: ITinlakeV3
  auth?: AuthState
}
const LoanOverview: React.FC<Props> = (props: Props) => {
  return (
    <Box margin={{ top: 'medium', bottom: 'medium' }}>
      <Heading level="4">Asset Overview {props.activePool?.name}</Heading>

      <Box direction="row" justify="between">
        <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
          <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
            <Heading level="5" margin={'0'}>
              Outstanding Volume
            </Heading>
            <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
              12.000 DAI
            </Heading>
          </Box>

          <Table margin={{ bottom: 'medium' }}>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Avg Financing Fee</TableCell>
                <TableCell style={{ textAlign: 'end' }}>7.43 %</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Table margin={{ bottom: 'small' }}>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Current Reserve</TableCell>
                <TableCell style={{ textAlign: 'end' }}>10.000 DAI</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Maximum Reserve Amount</TableCell>
                <TableCell style={{ textAlign: 'end' }}>15.000 DAI</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Total epoch investment capacity</TableCell>
                <TableCell style={{ textAlign: 'end' }}>5.000 DAI</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
            {/* <Button label="Set max reserve" /> */}
            <PoolLink href={'/assets/issue'}>
              <Button primary label="Open financing" />
            </PoolLink>
          </Box>
        </Box>

        <Box width="420px" margin={{ top: 'small', bottom: 'medium' }}>
          <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
            <Heading level="5" margin={'0'}>
              Current Epoch
            </Heading>
          </Box>

          <Table margin={{ bottom: 'medium' }}>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Epoch #</TableCell>
                <TableCell style={{ textAlign: 'end' }}>7</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Minimum epoch duration</TableCell>
                <TableCell style={{ textAlign: 'end' }}>24 hrs</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Minimum time left in current epoch</TableCell>
                <TableCell style={{ textAlign: 'end' }}>5 hrs, 10 min</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">
                  <Box direction="row">
                    <SignIcon src={`/static/plus.svg`} />
                    Total Pending Investments
                  </Box>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>10.000 DAI</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">
                  <Box direction="row">
                    <SignIcon src={`/static/min.svg`} />
                    Estimated Total Pending Redemptions
                  </Box>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>20.000 DAI</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state)(LoanOverview)
