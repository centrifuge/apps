import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Area, AreaChart, Tooltip as RechartsTooltip } from 'recharts'
import { Card } from '../../../components/Card'
import {
  ChartTooltip,
  ChartTooltipColor,
  ChartTooltipKey,
  ChartTooltipLine,
  ChartTooltipTitle,
  ChartTooltipValue,
  StyledResponsiveContainer,
} from '../../../components/Chart/styles'
import { Divider } from '../../../components/Divider'
import { SectionHeading } from '../../../components/Heading'
import { Shelf, Stack } from '../../../components/Layout'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Tooltip } from '../../../components/Tooltip'
import { Pool } from '../../../config'
import { AuthState, PermissionsV3 } from '../../../ducks/auth'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { dateToYMD } from '../../../utils/date'
import { UintBase } from '../../../utils/ratios'
import { toPrecision } from '../../../utils/toPrecision'
import { useDailyPoolData } from '../../../utils/useDailyPoolData'
import { useMedia } from '../../../utils/useMedia'
import { usePool } from '../../../utils/usePool'
import MaxReserveForm from './MaxReserveForm'
import { Sidenote } from './styles'

interface Props {
  selectedPool?: Pool
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
  const tinlake = useTinlake()
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const { data: assetData } = useDailyPoolData(tinlake.contractAddresses.ROOT_CONTRACT!)

  const isAdmin =
    poolData?.isPoolAdmin || (props.auth?.permissions && (props.auth?.permissions as PermissionsV3).canSetMaxReserve)

  const [showMaxReserveForm, setShowMaxReserveForm] = React.useState(false)

  const assetDataWithToday =
    assetData && assetData.length > 0
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

  const reserveElement = showMaxReserveForm ? (
    <MaxReserveForm setShowMaxReserveForm={setShowMaxReserveForm} selectedPool={props.selectedPool} />
  ) : (
    <>
      <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
        <SectionHeading>Asset Value</SectionHeading>
        <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
          <LoadingValue done={poolData?.netAssetValue !== undefined} height={22}>
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
              style={{ alignItems: 'start', justifyContent: 'center', verticalAlign: 'top' }}
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
                    Max: {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maxReserve || '0', 18), 0))}{' '}
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
                  <span>
                    <Tooltip id="discountRate" underline>
                      Discount rate
                    </Tooltip>
                  </span>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <LoadingValue done={poolData?.discountRate !== undefined}>
                    {toPrecision(feeToInterestRate(poolData?.discountRate || '0'), 2)}%
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row" style={{ alignItems: 'start', justifyContent: 'center' }}>
                  <span>Available funds for Financing</span>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <LoadingValue done={poolData?.reserve !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.availableFunds || '0', 18), 0))}{' '}
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
                    <span>Maker credit line</span>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                    <LoadingValue done={poolData?.reserve !== undefined} height={39}>
                      <>
                        {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.creditline || '0', 18), 0))}{' '}
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
                <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }} pad={{ top: '15px' }}>
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
  )

  const graphElement = (
    <Stack height="100%" gap="small">
      <Shelf justifyContent="space-between">
        <SectionHeading>Pool Value</SectionHeading>
        <Heading level="5" margin="none" color="#777777">
          {assetDataWithToday.length > 0 && dateToYMD(assetDataWithToday[0].day)} - present
        </Heading>
      </Shelf>
      {assetDataWithToday.length > 0 && (
        <div style={{ flex: '1 0 auto' }}>
          <StyledResponsiveContainer>
            <AreaChart data={assetDataWithToday} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
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
              <RechartsTooltip content={<CustomTooltip />} offset={20} />
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
          </StyledResponsiveContainer>
        </div>
      )}
    </Stack>
  )

  const isMobile = useMedia({ below: 'medium' })

  return isMobile ? (
    <Stack as={Card} p="medium" gap="medium">
      <div>{reserveElement}</div>
      <Divider bleedX="medium" width="auto" />
      <Box height="140px">{graphElement}</Box>
    </Stack>
  ) : (
    <Shelf gap="medium" alignItems="stretch">
      <Card p="medium" flex="1 1 420px" maxWidth="50%">
        {reserveElement}
      </Card>
      <Card p="medium" flex="1 1 480px" maxWidth="50%" height="200px">
        {graphElement}
      </Card>
    </Shelf>
  )
}

export default connect((state) => state)(LoanOverview)
