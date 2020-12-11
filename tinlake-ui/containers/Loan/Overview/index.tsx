import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { Pool } from '../../../config'
import { AuthState, PermissionsV3 } from '../../../ducks/auth'
import { loadPool, PoolData, PoolState } from '../../../ducks/pool'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toPrecision } from '../../../utils/toPrecision'
import MaxReserveForm from './MaxReserveForm'
import { Sidenote } from './styles'

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
          <Box
            width="420px"
            pad="medium"
            elevation="small"
            round="xsmall"
            margin={{ bottom: 'medium' }}
            background="white"
          >
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
      </Box>
    </Box>
  ) : (
    <>&nbsp;</>
  )
}

export default connect((state) => state)(LoanOverview)
