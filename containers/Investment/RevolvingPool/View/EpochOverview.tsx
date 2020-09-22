import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'
import { connect } from 'react-redux'
import { EpochData } from './index'
import { useSelector } from 'react-redux'
import { PoolDataV3, PoolState } from '../../../../ducks/pool'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import { SignIcon } from './styles'
import { useInterval } from '../../../../utils/hooks'

interface Props extends TransactionProps {
  epochData: EpochData
  tinlake: ITinlakeV3
}

const secondsToHms = (d: number) => {
  const h = Math.floor(d / 3600)
  const m = Math.floor((d % 3600) / 60)

  const hDisplay = h > 0 ? h + (h == 1 ? ' hr' : ' hrs') : ''
  const mDisplay = m > 0 ? m + (m == 1 ? ' min' : ' mins') : ''
  return hDisplay + (hDisplay.length > 0 && mDisplay.length > 0 ? ', ' : '') + mDisplay
}

const EpochOverview: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)

  const [status, , setTxId] = useTransactionState()

  const solve = async () => {
    const txId = await props.createTransaction(`Close epoch`, 'solveEpoch', [props.tinlake])
    setTxId(txId)
  }

  const execute = async () => {
    const txId = await props.createTransaction(`Execute epoch`, 'executeEpoch', [props.tinlake])
    setTxId(txId)
  }

  const disabled = status === 'unconfirmed' || status === 'pending'

  const [timePassed, setTimePassed] = React.useState(0)

  useInterval(() => {
    setTimePassed(new Date().getTime() / 1000 - props.epochData.lastEpochClosed)
  }, 1000)

  // const totalPendingInvestments =
  //   pool.data && (pool.data as PoolDataV3).senior
  //     ? (pool.data as PoolDataV3).junior?.pendingInvestments!.add((pool.data as PoolDataV3).senior?.pendingInvestments!)
  //     : new BN(0)

  return (
    <Box direction="column">
      <Box width="420px" margin={{ top: 'small', bottom: 'medium' }}>
        <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
          <Heading level="5" margin={'0'}>
            Current Epoch
          </Heading>
        </Box>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell scope="row">Epoch #</TableCell>
              <TableCell style={{ textAlign: 'end' }}>{props.epochData.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">Time passed since start of current epoch</TableCell>
              <TableCell style={{ textAlign: 'end' }}>{secondsToHms(timePassed)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">Minimum epoch duration</TableCell>
              <TableCell style={{ textAlign: 'end' }}>{secondsToHms(props.epochData.minimumEpochTime)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">Pool Reserve current</TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                {pool.data &&
                  addThousandsSeparators(toPrecision(baseToDisplay((pool.data as PoolDataV3).reserve, 18), 2))}{' '}
                DAI
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
          {props.epochData.state === 'can-be-closed' && (
            <Button label="Close epoch" primary onClick={solve} disabled={disabled} />
          )}
          {props.epochData.state === 'challenge-period-ended' && (
            <Button label="Execute orders" primary onClick={execute} disabled={disabled} />
          )}
        </Box>
      </Box>

      {pool.data && (pool.data as PoolDataV3).senior && (
        <Box width="420px" margin={{ bottom: 'medium' }}>
          <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
            <Heading level="5" margin={'0'}>
              Total Locked Orders
            </Heading>
          </Box>

          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">
                  <Box direction="row">
                    <SignIcon src={`/static/plus.svg`} />
                    Investments DROP Tranche
                  </Box>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay((pool.data as PoolDataV3).senior?.pendingInvestments!, 18), 2)
                  )}{' '}
                  DAI
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">
                  <Box direction="row">
                    <SignIcon src={`/static/plus.svg`} />
                    Investments TIN Tranche
                  </Box>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay((pool.data as PoolDataV3).junior?.pendingInvestments!, 18), 2)
                  )}{' '}
                  DAI
                </TableCell>
              </TableRow>
              {/* <TableRow>
                <TableCell scope="row">
                  <Box direction="row">Total Pending Investments</Box>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(totalPendingInvestments, 18), 2))} DAI
                </TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
          <br />

          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">
                  <Box direction="row">
                    <SignIcon src={`/static/min.svg`} />
                    Redemptions DROP Tranche
                  </Box>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay((pool.data as PoolDataV3).senior?.pendingRedemptions!, 18), 2)
                  )}{' '}
                  DROP
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">
                  <Box direction="row">
                    <SignIcon src={`/static/min.svg`} />
                    Redemptions TIN Tranche
                  </Box>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay((pool.data as PoolDataV3).junior?.pendingRedemptions!, 18), 2)
                  )}{' '}
                  TIN
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(EpochOverview)
