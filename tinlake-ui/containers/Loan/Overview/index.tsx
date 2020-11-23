import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { ITinlake, baseToDisplay } from '@centrifuge/tinlake-js'
import { connect, useSelector, useDispatch } from 'react-redux'
import { PoolData, PoolState, loadPool } from '../../../ducks/pool'
import { toPrecision } from '../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { LoadingValue } from '../../../components/LoadingValue/index'

import { SignIcon, Sidenote } from './styles'
import { AuthState, PermissionsV3 } from '../../../ducks/auth'
import { Pool } from '../../../config'
import { secondsToHms } from '../../../utils/time'
import MaxReserveForm from './MaxReserveForm'

interface Props {
  activePool?: Pool
  tinlake: ITinlake
  auth?: AuthState
}
const LoanOverview: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const dispatch = useDispatch()
  const address = useSelector<any, string | null>((state) => state.auth.address)

  const updateIsBorrower = async () => {
    if (address) {
      const proxyAddress = await props.tinlake.checkProxyExists(address)
      if (proxyAddress) setIsBorrower(true)
      else {
        setIsBorrower(props.auth?.permissions?.canSetMinimumJuniorRatio || false)
      }
    }
  }

  const [isBorrower, setIsBorrower] = React.useState(false)

  React.useEffect(() => {
    dispatch(loadPool(props.tinlake))
    updateIsBorrower()
  }, [address])

  const isAdmin = props.auth?.permissions && (props.auth?.permissions as PermissionsV3).canSetMaxReserve

  const [showMaxReserveForm, setShowMaxReserveForm] = React.useState(false)

  return isBorrower ? (
    <Box margin={{ bottom: 'medium' }}>
      <Box direction="row" justify="between">
        <Box>
          <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
            {!showMaxReserveForm && (
              <>
                <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
                  <Heading level="5" margin={'0'}>
                    Outstanding Volume
                  </Heading>
                  <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                    <LoadingValue done={poolData?.outstandingVolume !== undefined} height={22}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.outstandingVolume || '0', 18), 0))}{' '}
                      DAI
                    </LoadingValue>
                  </Heading>
                </Box>

                {/* <Table margin={{ bottom: 'medium' }}>
                    <TableBody>
                      <TableRow>
                        <TableCell scope="row">Avg Financing Fee</TableCell>
                        <TableCell style={{ textAlign: 'end' }}>7.43 %</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table> */}

                <Table margin={{ bottom: 'small' }}>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        scope="row"
                        style={{ alignItems: 'start', justifyContent: 'center' }}
                        pad={{ vertical: '6px' }}
                      >
                        <span>Pool reserve</span>
                      </TableCell>
                      <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                        <LoadingValue done={poolData?.reserve !== undefined} height={39}>
                          <>
                            {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.reserve || '0', 18), 0))} DAI
                            <Sidenote>
                              Max:{' '}
                              {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maxReserve || '0', 18), 0))}{' '}
                              DAI
                            </Sidenote>
                          </>
                        </LoadingValue>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        scope="row"
                        style={{ alignItems: 'start', justifyContent: 'center' }}
                        border={{ color: 'transparent' }}
                      >
                        <span>Available funds for financing</span>
                      </TableCell>
                      <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                        <LoadingValue done={poolData?.reserve !== undefined}>
                          {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.availableFunds || '0', 18), 0))}{' '}
                          DAI
                        </LoadingValue>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {isAdmin && (
                  <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
                    <Button label="Set max reserve" onClick={() => setShowMaxReserveForm(true)} disabled={!poolData} />
                  </Box>
                )}
              </>
            )}
            {showMaxReserveForm && (
              <MaxReserveForm tinlake={props.tinlake} setShowMaxReserveForm={setShowMaxReserveForm} />
            )}
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
                <TableCell style={{ textAlign: 'end' }}>
                  <LoadingValue done={poolData?.epoch?.id !== undefined}>{poolData?.epoch?.id || ''}</LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Minimum time left in current epoch</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <LoadingValue done={poolData?.epoch?.minimumEpochTimeLeft !== undefined}>
                    {secondsToHms(poolData?.epoch?.minimumEpochTimeLeft || 0)}
                  </LoadingValue>
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
                  <LoadingValue done={poolData?.totalPendingInvestments !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.totalPendingInvestments || '0', 18), 2)
                    )}{' '}
                    DAI
                  </LoadingValue>
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
                  <LoadingValue done={poolData?.totalRedemptionsCurrency !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.totalRedemptionsCurrency || '0', 18), 2)
                    )}{' '}
                    DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  ) : (
    <>&nbsp;</>
  )
}

export default connect((state) => state)(LoanOverview)
