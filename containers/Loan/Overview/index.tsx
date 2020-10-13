import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { ITinlake as ITinlakeV3, baseToDisplay } from '@centrifuge/tinlake-js-v3'
import { connect, useSelector, useDispatch } from 'react-redux'
import { PoolDataV3, PoolState, loadPool } from '../../../ducks/pool'
import { toPrecision } from '../../../utils/toPrecision'
import BN from 'bn.js'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'

import { SignIcon } from './styles'
import { AuthState } from '../../../ducks/auth'
import { Pool } from '../../../config'
import { TINRatioBar } from '../../../components/TINRatioBar/index'
import { secondsToHms } from '../../../utils/time'

const parseRatio = (num: BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}

interface Props {
  activePool?: Pool
  tinlake: ITinlakeV3
  auth?: AuthState
}
const LoanOverview: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolDataV3 | undefined

  const currentJuniorRatio = poolData ? parseRatio(poolData.currentJuniorRatio) : 0
  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : 0
  const maxJuniorRatio = poolData ? parseRatio(poolData.maxJuniorRatio) : 0
  const investmentCapacity = poolData ? poolData.maxReserve.sub(poolData.reserve) : new BN(0)

  const dispatch = useDispatch()
  const address = useSelector<any, string | null>((state) => state.auth.address)

  React.useEffect(() => {
    dispatch(loadPool(props.tinlake))
  }, [address])

  return (
    <Box margin={{ bottom: 'medium' }}>
      <Box direction="row" justify="between">
        <Box>
          <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Outstanding Volume
              </Heading>
              <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.outstandingVolume, 18), 2))} DAI
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

            {poolData && (
              <Table margin={{ bottom: 'small' }}>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Current Reserve</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(poolData.reserve, 18), 2))} DAI
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Maximum Reserve Amount</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(poolData.maxReserve, 18), 2))} DAI
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Total epoch investment capacity</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(
                        toPrecision(
                          baseToDisplay(investmentCapacity.lt(new BN(0)) ? new BN(0) : investmentCapacity, 18),
                          2
                        )
                      )}{' '}
                      DAI
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button label="Set max reserve" />
            </Box>
          </Box>
        </Box>

        <Box width="420px" margin={{ top: 'small', bottom: 'medium' }}>
          <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
            <Heading level="5" margin={'0'}>
              Current Epoch
            </Heading>
          </Box>

          {poolData && poolData.epoch && (
            <Table margin={{ bottom: 'medium' }}>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">Epoch #</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{poolData.epoch.id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Minimum epoch duration</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{secondsToHms(poolData.epoch.minimumEpochTime)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Minimum time left in current epoch</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    {secondsToHms(poolData.epoch.minimumEpochTimeLeft)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <Box direction="row">
                      <SignIcon src={`/static/plus.svg`} />
                      Total Pending Investments
                    </Box>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    {' '}
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData.totalPendingInvestments, 18), 2))} DAI
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <Box direction="row">
                      <SignIcon src={`/static/min.svg`} />
                      Estimated Total Pending Redemptions
                    </Box>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    {' '}
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData.totalRedemptionsCurrency, 18), 2))} DAI
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          <Box margin={{ top: 'small', bottom: 'large' }}>
            <Heading level="5" margin={{ top: 'none', bottom: '28px', left: 'auto', right: 'auto' }}>
              TIN Risk Buffer
            </Heading>
            <Box margin={{ left: '20px' }}>
              <TINRatioBar current={currentJuniorRatio} min={minJuniorRatio} max={maxJuniorRatio} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state)(LoanOverview)
