import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  ChartTooltip,
  ChartTooltipColor,
  ChartTooltipKey,
  ChartTooltipLine,
  ChartTooltipTitle,
  ChartTooltipValue,
} from '../../../components/Chart/styles'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { Pool } from '../../../config'
import { AuthState, PermissionsV3 } from '../../../ducks/auth'
import { AssetData, loadAssetData } from '../../../ducks/loans'
import { loadPool, PoolData, PoolState } from '../../../ducks/pool'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { dateToYMD } from '../../../utils/date'
import { UintBase } from '../../../utils/ratios'
import { toPrecision } from '../../../utils/toPrecision'
import MaxReserveForm from './MaxReserveForm'
import { Sidenote } from './styles'

interface Props {
  selectedPool?: Pool
  tinlake: ITinlake
  auth?: AuthState
}

const CustomTooltip = ({ active, payload }: any) => {
  return active && payload ? (
    <ChartTooltip>
      <ChartTooltipTitle>{dateToYMD(payload[0].payload.day)}</ChartTooltipTitle>
      <ChartTooltipLine>
        <ChartTooltipKey>=&nbsp;&nbsp;&nbsp; Pool Value:</ChartTooltipKey>
        <ChartTooltipValue>
          {addThousandsSeparators(payload[0].value + payload[1].value)} {payload[0].payload.currency}
        </ChartTooltipValue>
      </ChartTooltipLine>
      <ChartTooltipLine>
        <ChartTooltipKey>
          <ChartTooltipColor color="#ccc" /> Reserve:
        </ChartTooltipKey>
        <ChartTooltipValue>
          {addThousandsSeparators(payload[1].value)} {payload[0].payload.currency}
        </ChartTooltipValue>
      </ChartTooltipLine>
      <ChartTooltipLine>
        <ChartTooltipKey>
          <ChartTooltipColor color="#0828BE" /> Asset Value:
        </ChartTooltipKey>
        <ChartTooltipValue>
          {addThousandsSeparators(payload[0].value)} {payload[0].payload.currency}
        </ChartTooltipValue>
      </ChartTooltipLine>
    </ChartTooltip>
  ) : (
    <>&nbsp;</>
  )
}

const LoanOverview: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const assetData = useSelector<any, AssetData[]>((state) => state.loans.assetData)

  const dispatch = useDispatch()
  const address = useSelector<any, string | null>((state) => state.auth.address)

  React.useEffect(() => {
    dispatch(loadPool(props.tinlake))
    dispatch(loadAssetData(props.tinlake))
  }, [address])

  const isAdmin =
    poolData?.isPoolAdmin || (props.auth?.permissions && (props.auth?.permissions as PermissionsV3).canSetMaxReserve)

  const [showMaxReserveForm, setShowMaxReserveForm] = React.useState(false)

  const assetDataWithToday =
    assetData.length > 0
      ? [
          ...assetData,
          {
            reserve: parseFloat((poolData?.reserve || new BN(0)).div(UintBase).toString()),
            assetValue: parseFloat((poolData?.netAssetValue || new BN(0)).div(UintBase).toString()),
            day: Date.now() / 1000,
            currency: props.selectedPool?.metadata.currencySymbol || 'DAI',
          },
        ]
      : []

  return (
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
                    Asset Value
                  </Heading>
                  <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                    <LoadingValue done={poolData?.outstandingVolume !== undefined} height={22}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.netAssetValue || '0', 18), 0))}{' '}
                      {props.selectedPool?.metadata.currencySymbol || 'DAI'}
                    </LoadingValue>
                  </Heading>
                </Box>

                <Table margin={{ bottom: '0' }}>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        scope="row"
                        style={{ alignItems: 'start', justifyContent: 'center' }}
                        pad={{ vertical: '6px' }}
                        border={isAdmin ? undefined : { color: 'transparent' }}
                      >
                        <span>Pool reserve</span>
                      </TableCell>
                      <TableCell
                        style={{ textAlign: 'end' }}
                        pad={{ vertical: '6px' }}
                        border={isAdmin ? undefined : { color: 'transparent' }}
                      >
                        <LoadingValue done={poolData?.reserve !== undefined} height={39}>
                          <>
                            {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.reserve || '0', 18), 0))}{' '}
                            {props.selectedPool?.metadata.currencySymbol || 'DAI'}
                            <Sidenote>
                              Max:{' '}
                              {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maxReserve || '0', 18), 0))}{' '}
                              {props.selectedPool?.metadata.currencySymbol || 'DAI'}
                            </Sidenote>
                          </>
                        </LoadingValue>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {isAdmin && (
                  <>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell scope="row" style={{ alignItems: 'start', justifyContent: 'center' }}>
                            <span>Available funds for Financing</span>
                          </TableCell>
                          <TableCell style={{ textAlign: 'end' }}>
                            <LoadingValue done={poolData?.reserve !== undefined}>
                              {addThousandsSeparators(
                                toPrecision(baseToDisplay(poolData?.availableFunds || '0', 18), 0)
                              )}{' '}
                              {props.selectedPool?.metadata.currencySymbol || 'DAI'}
                            </LoadingValue>
                          </TableCell>
                        </TableRow>
                        {poolData?.maker?.line && (
                          <TableRow>
                            <TableCell
                              scope="row"
                              style={{ alignItems: 'start', justifyContent: 'center' }}
                              pad={{ vertical: '6px' }}
                            >
                              <span>Maker creditline</span>
                            </TableCell>
                            <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                              <LoadingValue done={poolData?.reserve !== undefined} height={39}>
                                <>
                                  {addThousandsSeparators(
                                    toPrecision(baseToDisplay(poolData?.maker?.creditline || '0', 18), 0)
                                  )}{' '}
                                  {props.selectedPool?.metadata.currencySymbol || 'DAI'}
                                  <Sidenote>
                                    Remaining:{' '}
                                    {addThousandsSeparators(
                                      toPrecision(baseToDisplay(poolData?.maker?.remainingCredit || '0', 18), 0)
                                    )}{' '}
                                    {props.selectedPool?.metadata.currencySymbol || 'DAI'}
                                  </Sidenote>
                                </>
                              </LoadingValue>
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell
                            scope="row"
                            style={{ alignItems: 'start', justifyContent: 'center' }}
                            border={{ color: 'transparent' }}
                            pad={{ top: '15px' }}
                          >
                            <span>Repaid this epoch</span>
                          </TableCell>
                          <TableCell
                            style={{ textAlign: 'end' }}
                            border={{ color: 'transparent' }}
                            pad={{ top: '15px' }}
                          >
                            <LoadingValue done={poolData?.reserve !== undefined}>
                              {addThousandsSeparators(
                                toPrecision(
                                  baseToDisplay(
                                    (poolData?.reserve || new BN(0))
                                      .add(poolData?.maker?.remainingCredit || new BN(0))
                                      .sub(poolData?.availableFunds || new BN(0)),
                                    18
                                  ),
                                  0
                                )
                              )}{' '}
                              {props.selectedPool?.metadata.currencySymbol || 'DAI'}
                            </LoadingValue>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {isAdmin && (
                      <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
                        <Button label="Manage" onClick={() => setShowMaxReserveForm(true)} disabled={!poolData} />
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
            {showMaxReserveForm && (
              <MaxReserveForm
                tinlake={props.tinlake}
                setShowMaxReserveForm={setShowMaxReserveForm}
                selectedPool={props.selectedPool}
              />
            )}
          </Box>
        </Box>

        <Box
          width="480px"
          height="200px"
          // pad="medium"
          elevation="small"
          round="xsmall"
          margin={{ bottom: 'medium' }}
          background="white"
        >
          <Box direction="row" justify="between">
            <Heading level="5" margin={{ top: 'medium', left: 'medium', bottom: '0' }}>
              Pool Value
            </Heading>
            <Heading level="5" margin={{ top: 'medium', right: 'medium' }} color="#9f9f9f">
              {assetDataWithToday.length > 0 && dateToYMD(assetDataWithToday[0].day)} - present
            </Heading>
          </Box>
          {assetDataWithToday.length > 0 && (
            <ResponsiveContainer>
              <AreaChart data={assetDataWithToday} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAssetValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0828BE" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0828BE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReserve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ccc" stopOpacity={0.2} />
                    <stop offset="50%" stopColor="#ccc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} offset={20} />
                {/* <XAxis dataKey="day" mirror tickFormatter={(val: number) => dateToYMD(val)} /> */}
                <Area
                  type="monotone"
                  stackId={1}
                  dataKey="assetValue"
                  stroke="#0828BE"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAssetValue)"
                  name="Asset Value"
                />
                <Area
                  type="monotone"
                  stackId={1}
                  dataKey="reserve"
                  stroke="#ccc"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReserve)"
                  name="Reserve"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state)(LoanOverview)
