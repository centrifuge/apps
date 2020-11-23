import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { ITinlake, baseToDisplay } from '@centrifuge/tinlake-js'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'
import { connect, useSelector } from 'react-redux'
import { AuthState } from '../../../ducks/auth'
import { PoolData, PoolState } from '../../../ducks/pool'
import { toPrecision } from '../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { SignIcon, Sidenote } from './styles'
import BN from 'bn.js'
import { secondsToHms } from '../../../utils/time'
import { LoadingValue } from '../../../components/LoadingValue/index'

interface Props extends TransactionProps {
  tinlake: ITinlake
  auth?: AuthState
}

const EpochOverview: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const [status, , setTxId] = useTransactionState()

  const solve = async () => {
    const txId = await props.createTransaction(`Close epoch ${poolData?.epoch?.id}`, 'solveEpoch', [props.tinlake])
    setTxId(txId)
  }

  const execute = async () => {
    const txId = await props.createTransaction(`Execute epoch ${poolData?.epoch?.id}`, 'executeEpoch', [props.tinlake])
    setTxId(txId)
  }

  const disabled = status === 'unconfirmed' || status === 'pending'

  const investmentCapacity = poolData ? poolData.maxReserve.sub(poolData.reserve) : undefined

  const isAdmin = props.auth?.permissions?.canSetMinimumJuniorRatio

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
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={poolData?.epoch?.id !== undefined}>{poolData?.epoch?.id || ''}</LoadingValue>
              </TableCell>
            </TableRow>
            {!poolData?.epoch?.isBlockedState && (
              <>
                <TableRow>
                  <TableCell scope="row">Minimum epoch duration</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={poolData?.epoch?.minimumEpochTime !== undefined}>
                      {secondsToHms(poolData?.epoch?.minimumEpochTime || 0)}
                    </LoadingValue>
                  </TableCell>
                </TableRow>
              </>
            )}
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
              >
                Current epoch state
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                <LoadingValue done={poolData?.epoch?.state !== undefined} height={39}>
                  {(poolData?.epoch?.state === 'open' || poolData?.epoch?.state === 'can-be-closed') && (
                    <>
                      Open
                      <Sidenote>Min time left: {secondsToHms(poolData?.epoch?.minimumEpochTimeLeft || 0)}</Sidenote>
                    </>
                  )}
                  {(poolData?.epoch?.state === 'in-submission-period' ||
                    poolData?.epoch?.state === 'in-challenge-period' ||
                    poolData?.epoch?.state === 'challenge-period-ended') && (
                    <>
                      In computation period
                      {poolData?.epoch.minChallengePeriodEnd > 0 && (
                        <Sidenote>
                          Min time left:{' '}
                          {secondsToHms(
                            (poolData?.epoch.minChallengePeriodEnd || 0) + 60 - new Date().getTime() / 1000
                          )}
                        </Sidenote>
                      )}
                    </>
                  )}
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">Total epoch investment capacity</TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={investmentCapacity !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(
                      baseToDisplay(
                        (investmentCapacity || new BN(0)).lt(new BN(0)) ? new BN(0) : investmentCapacity || new BN(0),
                        18
                      ),
                      0
                    )
                  )}{' '}
                  DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {isAdmin && poolData?.epoch && (
          <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
            {poolData.epoch.state === 'can-be-closed' && (
              <Button
                label={`Close epoch`}
                primary
                onClick={solve}
                disabled={
                  disabled ||
                  poolData.epoch?.lastEpochClosed + poolData.epoch?.minimumEpochTime >= new Date().getTime() / 1000
                }
              />
            )}
            {poolData.epoch.state === 'in-submission-period' && <Button label={`Run solver`} primary disabled={true} />}
            {poolData.epoch.state === 'in-challenge-period' && (
              <Button label={`Execute epoch ${poolData.epoch.id}`} primary disabled={true} />
            )}
            {poolData.epoch.state === 'challenge-period-ended' && (
              <Button label={`Execute epoch ${poolData.epoch.id}`} primary onClick={execute} disabled={disabled} />
            )}
          </Box>
        )}
      </Box>

      <Box width="420px" margin={{ top: 'medium', bottom: 'medium' }}>
        <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
          <Heading level="5" margin={'0'}>
            Total Locked Orders
          </Heading>
        </Box>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell scope="row" border={{ color: 'transparent' }} pad={{ vertical: '6px' }}>
                <Box direction="row">
                  <SignIcon src={`/static/plus.svg`} />
                  Investments DROP Tranche
                </Box>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }} pad={{ vertical: '6px' }}>
                <LoadingValue done={poolData?.senior?.pendingInvestments !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay(poolData?.senior?.pendingInvestments || '0', 18), 0)
                  )}{' '}
                  DAI
                </LoadingValue>
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
                <LoadingValue done={poolData?.junior?.pendingInvestments !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay(poolData?.junior?.pendingInvestments || '0', 18), 0)
                  )}{' '}
                  DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">
                <Box direction="row">Total Pending Investments</Box>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={poolData?.totalPendingInvestments !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.totalPendingInvestments || '0', 18), 0))}{' '}
                  DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <br />

        <Table>
          <TableBody>
            <TableRow>
              <TableCell scope="row" border={{ color: 'transparent' }} pad={{ top: '15px', bottom: '6px' }}>
                <Box direction="row">
                  <SignIcon src={`/static/min.svg`} />
                  Redemptions DROP Tranche
                </Box>
              </TableCell>
              <TableCell
                style={{ textAlign: 'end' }}
                border={{ color: 'transparent' }}
                pad={{ top: '15px', bottom: '6px' }}
              >
                <LoadingValue done={poolData?.senior?.pendingRedemptions !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay(poolData?.senior?.pendingRedemptions || '0', 18), 0)
                  )}{' '}
                  DROP
                </LoadingValue>
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
                <LoadingValue done={poolData?.junior?.pendingRedemptions !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay(poolData?.junior?.pendingRedemptions || '0', 18), 0)
                  )}{' '}
                  TIN
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">
                <Box direction="row">Estimated Total Pending Redemptions in DAI</Box>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={poolData?.totalRedemptionsCurrency !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.totalRedemptionsCurrency || '0', 18), 0))}{' '}
                  DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(EpochOverview)
