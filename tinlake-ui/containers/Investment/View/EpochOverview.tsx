import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import { FormDown } from 'grommet-icons'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useQuery } from 'react-query'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Button } from '../../../components/Button'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Card } from '../../../components/Card'
import { Divider } from '../../../components/Divider'
import { SectionHeading } from '../../../components/Heading'
import { Box, Stack, Wrap } from '../../../components/Layout'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { Tooltip } from '../../../components/Tooltip'
import { Pool } from '../../../config'
import { AuthState } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Fixed27Base } from '../../../utils/ratios'
import { secondsToHms } from '../../../utils/time'
import { toPrecision } from '../../../utils/toPrecision'
import { useEpoch } from '../../../utils/useEpoch'
import { useMedia } from '../../../utils/useMedia'
import { usePool } from '../../../utils/usePool'
import { Caret } from './styles'

interface Props extends TransactionProps {
  tinlake: ITinlake
  auth?: AuthState
  activePool?: Pool
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const EpochOverview: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const { root } = router.query

  const { data: poolData } = usePool(root as string)
  const { data: epochData } = useEpoch(root as string)

  const isMobile = useMedia({ below: 'medium' })

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

  const [open, setOpen] = React.useState(false)

  const showEpochButton = React.useMemo(
    () => epochData && (poolData?.isPoolAdmin || router.query.show_close_epoch === 'true'),
    [epochData, poolData, router.query]
  )

  const epochButtonElement = React.useMemo(() => {
    switch (epochData?.state) {
      case 'can-be-closed':
        return (
          <Button
            label="Close epoch"
            primary
            onClick={solve}
            disabled={
              disabled || epochData?.lastEpochClosed + epochData?.minimumEpochTime >= new Date().getTime() / 1000
            }
          />
        )
      case 'in-submission-period':
        return <Button label="Submit a solution" primary onClick={solve} />
      case 'in-challenge-period':
        return <Button label={`Execute epoch ${epochData?.id}`} primary disabled />
      case 'challenge-period-ended':
        return <Button label={`Execute epoch ${epochData?.id}`} primary onClick={execute} disabled={disabled} />
      case 'open':
        return <Button label="Close epoch" primary disabled />
      default:
        return null
    }
  }, [disabled, epochData, poolData, router.query])

  const { data: solution } = useQuery(
    ['epochSolution', root],
    async () => {
      const epochState = await props.tinlake.getEpochState(true)
      const orders = {
        tinRedeem: poolData?.junior?.pendingRedemptions || new BN(0),
        dropRedeem: poolData?.senior?.pendingRedemptions || new BN(0),
        tinInvest: poolData?.junior?.pendingInvestments || new BN(0),
        dropInvest: poolData?.senior?.pendingInvestments || new BN(0),
      }
      const solution = await props.tinlake.runSolver(epochState, orders)
      return solution
    },
    {
      enabled: !!(poolData?.senior && poolData?.junior),
    }
  )

  const getSolutionState = () => {
    const orders = {
      tinRedeem: poolData?.junior?.pendingRedemptions || new BN(0),
      dropRedeem: poolData?.senior?.pendingRedemptions || new BN(0),
      tinInvest: poolData?.junior?.pendingInvestments || new BN(0),
      dropInvest: poolData?.senior?.pendingInvestments || new BN(0),
    }
    const orderSum: BN = Object.values(orders).reduce((prev: any, order) => prev.add(order), new BN('0'))
    const solutionSum: BN =
      solution?.dropInvest !== undefined
        ? solution.dropInvest.add(solution.dropRedeem).add(solution.tinInvest).add(solution.tinRedeem)
        : new BN(0)

    if (orderSum.lte(new BN('10').pow(new BN('18')))) return 'no-orders-locked'
    if (solutionSum.lte(new BN('10').pow(new BN('18')))) return 'no-executions'
    if (solutionSum.lt(orderSum)) return 'partial-executions'
    return 'to-be-closed'
  }

  const solutionState = getSolutionState()

  const formatCurrencyAmount = (bn: BN | undefined) => {
    if (!bn) return ''
    // lose some precision to get rid of dust
    const n = bn.div(new BN(1e6))
    return `${addThousandsSeparators(toPrecision(baseToDisplay(n || '0', 12), 0))} ${
      props.activePool?.metadata.currencySymbol || 'DAI'
    }`
  }

  const formatPercentage = (numerator: BN | undefined, denominator: BN | undefined) => {
    if (!numerator || !denominator) return ''
    const a = numerator.div(new BN(1e6))
    let b = numerator.div(new BN(1e6))
    b = b.isZero() ? new BN(1) : b
    const percentage = (parseInt(a.toString(), 10) / parseInt(b.toString(), 10)) * 100
    return `${percentFormatter.format(percentage)}%`
  }

  const tableData = {
    dropInvestLocked: formatCurrencyAmount(poolData?.senior?.pendingInvestments),
    dropInvestTBE: formatCurrencyAmount(solution?.dropInvest),
    dropInvestTBEPercent: formatPercentage(solution?.dropInvest, poolData?.senior?.pendingInvestments),
    tinInvestLocked: formatCurrencyAmount(poolData?.junior?.pendingInvestments),
    tinInvestTBE: formatCurrencyAmount(solution?.tinInvest),
    tinInvestTBEPercent: formatPercentage(solution?.tinInvest, poolData?.junior?.pendingInvestments),
    totalInvestLocked: formatCurrencyAmount(poolData?.totalPendingInvestments),
    totalInvestTBE: formatCurrencyAmount(solution?.dropInvest.add(solution.tinInvest)),
    totalInvestTBEPercent: formatPercentage(
      solution?.dropInvest.add(solution?.tinInvest),
      poolData?.totalPendingInvestments
    ),
    dropRedeemLocked: formatCurrencyAmount(
      poolData?.senior.pendingRedemptions?.mul(poolData?.senior.tokenPrice).div(Fixed27Base)
    ),
    dropRedeemTBE: formatCurrencyAmount(
      poolData && solution?.dropRedeem.mul(poolData.senior.tokenPrice).div(Fixed27Base)
    ),
    dropRedeemTBEPercent: formatPercentage(solution?.dropRedeem, poolData?.senior?.pendingRedemptions),
    tinRedeemLocked: formatCurrencyAmount(
      poolData?.junior.pendingRedemptions &&
        poolData.junior.pendingRedemptions.mul(poolData.junior.tokenPrice).div(Fixed27Base)
    ),
    tinRedeemTBE: formatCurrencyAmount(
      poolData && solution?.tinRedeem.mul(poolData.junior.tokenPrice).div(Fixed27Base)
    ),
    tinRedeemTBEPercent: formatPercentage(solution?.tinRedeem, poolData?.junior?.pendingRedemptions),
    totalRedeemLocked: formatCurrencyAmount(poolData?.totalRedemptionsCurrency),
    totalRedeemTBE: formatCurrencyAmount(
      solution &&
        poolData &&
        solution.dropRedeem
          .mul(poolData.senior.tokenPrice)
          .div(Fixed27Base)
          .add(solution.tinRedeem.mul(poolData.junior.tokenPrice).div(Fixed27Base))
    ),
    totalRedeemTBEPercent: formatPercentage(
      poolData &&
        solution?.dropRedeem
          .mul(poolData.senior.tokenPrice)
          .div(Fixed27Base)
          .add(solution.tinRedeem.mul(poolData.junior.tokenPrice).div(Fixed27Base)),
      poolData?.totalRedemptionsCurrency
    ),
  }

  return (
    <Card interactive p={24}>
      <Wrap gap="small" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        {epochData?.state === 'open' && <EpochIcon src="/static/clock.svg" />}
        {epochData?.state === 'can-be-closed' && solutionState !== 'to-be-closed' && (
          <EpochIcon src="/static/help-circle.svg" />
        )}
        {((epochData?.state === 'can-be-closed' && solutionState === 'to-be-closed') ||
          epochData?.state === 'challenge-period-ended') && <EpochIcon src="/static/circle-checked.svg" />}
        {(epochData?.state === 'in-submission-period' || epochData?.state === 'in-challenge-period') && (
          <EpochIcon src="/static/clock.svg" />
        )}

        <SectionHeading>Epoch {epochData?.id}</SectionHeading>
        <EpochState
          gap="small"
          rowGap={0}
          alignItems="baseline"
          flexDirection={['column', 'row']}
          order={[3, 'initial']}
          flexBasis={['100%', 'auto']}
        >
          <LoadingValue done={epochData?.state !== undefined} alignRight={false} maxWidth={120}>
            {epochData?.state === 'open' && <h4>Ongoing</h4>}
            {epochData?.state === 'can-be-closed' && <h4>Minimum duration ended</h4>}
            {epochData?.state === 'in-submission-period' && <h4>Computing orders</h4>}
            {epochData?.state === 'in-challenge-period' && <h4>Computing orders</h4>}
            {epochData?.state === 'challenge-period-ended' && <h4>Orders computed</h4>}
            {epochData?.state === 'open' && (
              <Tooltip
                title="Tinlake epochs have a minimum duration of 24 hours. Once the minimum duration has passed, the epoch will be closed and, if possible, the orders will be executed."
                underline
              >
                <h5>{secondsToHms(epochData?.minimumEpochTimeLeft || 0)} until end of minimum duration</h5>
              </Tooltip>
            )}
            {epochData?.state === 'can-be-closed' && (
              <>
                {solutionState === 'to-be-closed' && (
                  <Tooltip
                    title="The minimum epoch duration has passed and will soon be closed automatically. All locked orders will be executed."
                    underline
                  >
                    <h5>To be closed</h5>
                  </Tooltip>
                )}
                {solutionState === 'no-orders-locked' && (
                  <Tooltip
                    title="The minimum epoch duration has passed but currently no orders are locked. The epoch will be closed once orders are locked and can be executed."
                    underline
                  >
                    <h5>No orders locked</h5>
                  </Tooltip>
                )}
                {solutionState === 'no-executions' && (
                  <Tooltip
                    title="The minimum epoch duration has passed but the locked orders cannot be executed. This may be because the pool is oversubscribed or no liquidity is available for redemptions. The epoch will be closed and orders executed as soon as the pool state changes or liquidity is provided."
                    underline
                  >
                    <h5>Locked orders cannot be executed</h5>
                  </Tooltip>
                )}
                {solutionState === 'partial-executions' && (
                  <Tooltip
                    title="The minimum epoch duration has passed but only a fraction of the locked orders could be executed. The epoch is not automatically closed to avoid unsustainable gas fees for small transaction amounts."
                    underline
                  >
                    <h5>Locked orders can only be partially executed</h5>
                  </Tooltip>
                )}
              </>
            )}
            {epochData?.state === 'in-submission-period' && (
              <Tooltip
                title="The epoch has been closed and orders are currently being computed. After the computing period has ended the orders will be executed."
                underline
              >
                <h5>Minimum {secondsToHms(epochData?.challengeTime || 0)} remaining</h5>
              </Tooltip>
            )}
            {epochData?.state === 'in-challenge-period' && (
              <Tooltip
                title="The epoch has been closed and orders are currently being computed. After the computing period has ended the orders will be executed."
                underline
              >
                <h5>
                  {secondsToHms((epochData?.minChallengePeriodEnd || 0) + 60 - new Date().getTime() / 1000)}{' '}
                  remaining...
                </h5>
              </Tooltip>
            )}
            {epochData?.state === 'challenge-period-ended' && (
              <Tooltip
                title="The epoch has been closed and orders have been computed. The orders will be executed shortly."
                underline
              >
                <h5>To be closed</h5>
              </Tooltip>
            )}
          </LoadingValue>
        </EpochState>
        <Caret style={{ marginLeft: 'auto', position: 'relative', top: '0' }}>
          <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
        </Caret>
      </Wrap>
      {open && (
        <Box mt="medium">
          {isMobile ? (
            <Stack gap="medium">
              <Divider width="auto" bleedX="medium" />
              <Stack gap="small">
                <SectionHeading>Investments</SectionHeading>
                <div>
                  <MobileTable
                    title="DROP Investments"
                    locked={tableData.dropInvestLocked}
                    tbe={tableData.dropInvestTBE}
                    percent={tableData.dropInvestTBEPercent}
                  />
                  <MobileTable
                    title="TIN Investments"
                    locked={tableData.tinInvestLocked}
                    tbe={tableData.tinInvestTBE}
                    percent={tableData.tinInvestTBEPercent}
                  />
                </div>
              </Stack>
              <Stack gap="small">
                <SectionHeading>Redemptions</SectionHeading>
                <div>
                  <MobileTable
                    title="DROP Redemptions"
                    locked={tableData.dropRedeemLocked}
                    tbe={tableData.dropRedeemTBE}
                    percent={tableData.dropRedeemTBEPercent}
                  />
                  <MobileTable
                    title="TIN Redemptions"
                    locked={tableData.tinRedeemLocked}
                    tbe={tableData.tinRedeemTBE}
                    percent={tableData.tinRedeemTBEPercent}
                  />
                </div>
              </Stack>
            </Stack>
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell size="40%">Investments</TableCell>
                    <TableCell size="20%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                      Locked
                    </TableCell>
                    <TableCell size="30%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                      To be executed
                    </TableCell>
                    <TableCell size="10%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                      In %
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>DROP investments</TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.dropInvestLocked}>{tableData.dropInvestLocked}</LoadingValue>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.dropInvestTBE}>{tableData.dropInvestTBE}</LoadingValue>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.dropInvestTBEPercent}>
                        {tableData.dropInvestTBEPercent}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TIN investments</TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.tinInvestLocked}>{tableData.tinInvestLocked}</LoadingValue>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.tinInvestTBE}>{tableData.tinInvestTBE}</LoadingValue>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.tinInvestTBEPercent}>
                        {tableData.tinInvestTBEPercent}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow style={{ fontWeight: 'bold' }}>
                    <TableCell border={{ side: 'bottom', color: '#dedede' }}>Total pending investments</TableCell>
                    <TableCell border={{ side: 'bottom', color: '#dedede' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalInvestLocked}>{tableData.totalInvestLocked}</LoadingValue>
                    </TableCell>
                    <TableCell border={{ side: 'bottom', color: '#dedede' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalInvestTBE}>{tableData.totalInvestTBE}</LoadingValue>
                    </TableCell>
                    <TableCell border={{ side: 'bottom', color: '#dedede' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalInvestTBEPercent}>
                        {tableData.totalInvestTBEPercent}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <br />
              <br />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell size="40%">Redemptions</TableCell>
                    <TableCell size="20%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                      Locked
                    </TableCell>
                    <TableCell size="30%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                      To be executed
                    </TableCell>
                    <TableCell size="10%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                      In %
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>DROP redemptions</TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.dropRedeemLocked}>{tableData.dropRedeemLocked}</LoadingValue>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.dropRedeemTBE}>{tableData.dropRedeemTBE}</LoadingValue>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.dropRedeemTBEPercent}>
                        {tableData.dropRedeemTBEPercent}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TIN redemptions</TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.tinRedeemLocked}>{tableData.tinRedeemLocked}</LoadingValue>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.tinRedeemTBE}>{tableData.tinRedeemTBE}</LoadingValue>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.tinRedeemTBEPercent}>
                        {tableData.tinRedeemTBEPercent}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow style={{ fontWeight: 'bold' }}>
                    <TableCell border={{ side: 'bottom', color: '#dedede' }}>Total pending redemptions</TableCell>
                    <TableCell border={{ side: 'bottom', color: '#dedede' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalRedeemLocked}>{tableData.totalRedeemLocked}</LoadingValue>
                    </TableCell>
                    <TableCell border={{ side: 'bottom', color: '#dedede' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalRedeemTBE}>{tableData.totalRedeemTBE}</LoadingValue>
                    </TableCell>
                    <TableCell border={{ side: 'bottom', color: '#dedede' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalRedeemTBEPercent}>
                        {tableData.totalRedeemTBEPercent}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableWrapper>
          )}

          {showEpochButton && <ButtonGroup mb="medium">{epochButtonElement}</ButtonGroup>}
        </Box>
      )}
    </Card>
  )
}

const MobileTable = ({ title, locked, tbe, percent }: any) => (
  <div>
    <MobileTableHeading>{title}</MobileTableHeading>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Locked</TableCell>
          <TableCell style={{ textAlign: 'right' }}>
            <LoadingValue done={!!locked}>{locked}</LoadingValue>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell border={{ color: 'transparent' }}>To be executed</TableCell>
          <TableCell border={{ color: 'transparent' }} style={{ textAlign: 'right' }}>
            <LoadingValue done={!!tbe}>
              {tbe}
              <br /> <span style={{ fontSize: '12px' }}>({percent})</span>
            </LoadingValue>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
)

const EpochState = styled(Wrap)`
  h4,
  h5 {
    line-height: 24px;
    font-size: 14px;
    margin: 0;
    color: #777777;
  }
`

const TableWrapper = styled.div`
  margin-left: 40px;
  margin-bottom: 24px;
`

const MobileTableHeading = styled.div`
  font-size: 14px;
  font-weight: 500;
`

const EpochIcon = styled.img`
  width: 24px;
  height: 24px;
`

export default connect((state) => state, { createTransaction })(EpochOverview)
