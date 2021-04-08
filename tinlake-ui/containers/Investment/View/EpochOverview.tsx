import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import { FormDown } from 'grommet-icons'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { Tooltip } from '../../../components/Tooltip'
import { Pool } from '../../../config'
import { AuthState } from '../../../ducks/auth'
import { EpochData, PoolData, PoolState } from '../../../ducks/pool'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { secondsToHms } from '../../../utils/time'
import { toPrecision } from '../../../utils/toPrecision'
import { Caret, Sidenote, SignIcon } from './styles'

interface Props extends TransactionProps {
  tinlake: ITinlake
  auth?: AuthState
  activePool?: Pool
}

const EpochOverview: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined
  const epochData = pool?.epoch as EpochData | undefined

  const [status, , setTxId] = useTransactionState()

  const solve = async () => {
    const txId = await props.createTransaction(`Close epoch ${epochData?.id}`, 'solveEpoch', [props.tinlake])
    setTxId(txId)
  }

  const execute = async () => {
    const txId = await props.createTransaction(`Execute epoch ${epochData?.id}`, 'executeEpoch', [props.tinlake])
    setTxId(txId)
  }

  const disabled = status === 'unconfirmed' || status === 'pending'

  const investmentCapacity = poolData ? poolData.maxReserve.sub(poolData.reserve) : undefined

  const [open, setOpen] = React.useState(false)

  return (
    <Box background="#eee" pad={{ horizontal: '34px', bottom: 'xsmall' }} round="xsmall" margin={{ bottom: 'medium' }}>
      <Heading level="4" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        Epoch Details
        <Caret>
          <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
        </Caret>
      </Heading>
      {open && (
        <Box direction="row" justify="between" margin={{ bottom: 'medium' }}>
          <Box width="420px" margin={{ bottom: 'medium' }}>
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
                      {props.activePool?.metadata.currencySymbol || 'DAI'}
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
                      {props.activePool?.metadata.currencySymbol || 'DAI'}
                    </LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <Box direction="row">Total Pending Investments</Box>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={poolData?.totalPendingInvestments !== undefined}>
                      {addThousandsSeparators(
                        toPrecision(baseToDisplay(poolData?.totalPendingInvestments || '0', 18), 0)
                      )}{' '}
                      {props.activePool?.metadata.currencySymbol || 'DAI'}
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
                    <Box direction="row">
                      Estimated Total Pending Redemptions in {props.activePool?.metadata.currencySymbol || 'DAI'}
                    </Box>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={poolData?.totalRedemptionsCurrency !== undefined}>
                      {addThousandsSeparators(
                        toPrecision(baseToDisplay(poolData?.totalRedemptionsCurrency || '0', 18), 0)
                      )}{' '}
                      {props.activePool?.metadata.currencySymbol || 'DAI'}
                    </LoadingValue>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Box width="420px" margin={{ top: 'small', bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Current Epoch
              </Heading>
            </Box>

            <Table>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">
                    <Tooltip id="epochNumber">Epoch #</Tooltip>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={epochData?.id !== undefined}>{epochData?.id || ''}</LoadingValue>
                  </TableCell>
                </TableRow>
                {!epochData?.isBlockedState && (
                  <>
                    <TableRow>
                      <TableCell scope="row">
                        <Tooltip id="mininumEpochDuration">Minimum epoch duration</Tooltip>
                      </TableCell>
                      <TableCell style={{ textAlign: 'end' }}>
                        <LoadingValue done={epochData?.minimumEpochTime !== undefined}>
                          {secondsToHms(epochData?.minimumEpochTime || 0)}
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
                    <LoadingValue done={epochData?.state !== undefined} height={39}>
                      {(epochData?.state === 'open' || epochData?.state === 'can-be-closed') && (
                        <>
                          Open
                          <Sidenote>Min time left: {secondsToHms(epochData?.minimumEpochTimeLeft || 0)}</Sidenote>
                        </>
                      )}
                      {(epochData?.state === 'in-submission-period' ||
                        epochData?.state === 'in-challenge-period' ||
                        epochData?.state === 'challenge-period-ended') && (
                        <>
                          In computation period
                          {epochData?.minChallengePeriodEnd > 0 && (
                            <Sidenote>
                              Min time left:{' '}
                              {secondsToHms((epochData?.minChallengePeriodEnd || 0) + 60 - new Date().getTime() / 1000)}
                            </Sidenote>
                          )}
                        </>
                      )}
                    </LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <Tooltip id="investmentCapacity">Total epoch investment capacity</Tooltip>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={investmentCapacity !== undefined}>
                      {addThousandsSeparators(
                        toPrecision(
                          baseToDisplay(
                            (investmentCapacity || new BN(0)).lt(new BN(0))
                              ? new BN(0)
                              : investmentCapacity || new BN(0),
                            18
                          ),
                          0
                        )
                      )}{' '}
                      {props.activePool?.metadata.currencySymbol || 'DAI'}
                    </LoadingValue>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {epochData && (
              <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
                {epochData?.state === 'can-be-closed' && (
                  <Button
                    label={`Close epoch`}
                    primary
                    onClick={solve}
                    disabled={
                      disabled ||
                      epochData?.lastEpochClosed + epochData?.minimumEpochTime >= new Date().getTime() / 1000
                    }
                  />
                )}
                {epochData?.state === 'in-submission-period' && (
                  <Button label={`Submit a solution`} primary onClick={solve} />
                )}
                {epochData?.state === 'in-challenge-period' && (
                  <Button label={`Execute epoch ${epochData?.id}`} primary disabled={true} />
                )}
                {epochData?.state === 'challenge-period-ended' && (
                  <Button label={`Execute epoch ${epochData?.id}`} primary onClick={execute} disabled={disabled} />
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(EpochOverview)
