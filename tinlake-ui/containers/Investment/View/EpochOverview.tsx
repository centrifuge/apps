import { Tooltip } from '@centrifuge/axis-tooltip'
import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import { FormDown } from 'grommet-icons'
import { useRouter } from 'next/router'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'
import { SolverResult } from '../../../../tinlake.js/dist/services/solver/solver'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { Pool } from '../../../config'
import { AuthState } from '../../../ducks/auth'
import { EpochData, PoolData, PoolState } from '../../../ducks/pool'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Fixed27Base } from '../../../utils/ratios'
import { secondsToHms } from '../../../utils/time'
import { toPrecision } from '../../../utils/toPrecision'
import { HelpIcon } from '../../Onboarding/styles'
import { Caret } from './styles'

interface Props extends TransactionProps {
  tinlake: ITinlake
  auth?: AuthState
  activePool?: Pool
}

const EpochOverview: React.FC<Props> = (props: Props) => {
  const router = useRouter()

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

  const [open, setOpen] = React.useState(false)

  const showEpochButton = React.useMemo(
    () => epochData && (poolData?.isPoolAdmin || router.query.show_close_epoch === 'true'),
    [epochData, poolData, router.query]
  )

  const EpochButton = React.useCallback(() => {
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

  const [solution, setSolution] = React.useState(undefined as SolverResult | undefined)

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

  const updateSolution = async () => {
    const epochState = await props.tinlake.getEpochState(true)
    const orders = {
      tinRedeem: poolData?.junior?.pendingRedemptions || new BN(0),
      dropRedeem: poolData?.senior?.pendingRedemptions || new BN(0),
      tinInvest: poolData?.junior?.pendingInvestments || new BN(0),
      dropInvest: poolData?.senior?.pendingInvestments || new BN(0),
    }
    const solution = await props.tinlake.runSolver(epochState, orders)
    setSolution(solution)
  }

  React.useEffect(() => {
    if (poolData?.senior && poolData?.junior) {
      updateSolution()
    }
  }, [poolData?.senior, poolData?.junior])

  const formatCurrencyAmount = (bn: BN | undefined) => {
    if (!bn) return ''
    return `${addThousandsSeparators(toPrecision(baseToDisplay(bn || '0', 18), 0))} ${
      props.activePool?.metadata.currencySymbol || 'DAI'
    }`
  }

  return (
    <Box background="#eee" pad={{ horizontal: '34px', bottom: 'xsmall' }} round="xsmall" margin={{ bottom: 'medium' }}>
      <Box direction="row" pad={'26px 0 20px 0'} onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        {epochData?.state === 'open' && <HelpIcon src="/static/clock.svg" />}
        {epochData?.state === 'can-be-closed' && getSolutionState() !== 'to-be-closed' && (
          <HelpIcon src="/static/help-circle.svg" />
        )}
        {((epochData?.state === 'can-be-closed' && getSolutionState() === 'to-be-closed') ||
          epochData?.state === 'challenge-period-ended') && <HelpIcon src="/static/circle-checked.svg" />}
        {(epochData?.state === 'in-submission-period' || epochData?.state === 'in-challenge-period') && (
          <HelpIcon src="/static/clock.svg" />
        )}
        <EpochState>
          <LoadingValue done={epochData?.state !== undefined && solution !== undefined} maxWidth={120}>
            <h3>Epoch {epochData?.id}</h3>

            {epochData?.state === 'open' && <h4>Ongoing</h4>}
            {epochData?.state === 'can-be-closed' && <h4>Minimum duration ended</h4>}
            {epochData?.state === 'in-submission-period' && <h4>Computing orders</h4>}
            {epochData?.state === 'in-challenge-period' && <h4>Computing orders</h4>}
            {epochData?.state === 'challenge-period-ended' && <h4>Orders computed</h4>}

            {epochData?.state === 'open' && (
              <Tooltip
                title="Tinlake epochs have a minimum duration of 24 hours. Once the minimum duration has passed, the epoch will be closed and, if possible, the orders will be executed.
              "
              >
                <h5>{secondsToHms(epochData?.minimumEpochTimeLeft || 0)} until end of minimum duration</h5>
              </Tooltip>
            )}
            {epochData?.state === 'can-be-closed' && (
              <>
                {getSolutionState() === 'to-be-closed' && (
                  <Tooltip title="The minimum epoch duration has passed and will soon be closed automatically. All locked orders will be executed.">
                    <h5>To be closed</h5>
                  </Tooltip>
                )}
                {getSolutionState() === 'no-orders-locked' && (
                  <Tooltip title="The minimum epoch duration has passed but currently no orders are locked. The epoch will be closed once orders are locked and can be executed.">
                    <h5>No orders locked</h5>
                  </Tooltip>
                )}
                {getSolutionState() === 'no-executions' && (
                  <Tooltip title="The minimum epoch duration has passed but the locked orders cannot be executed. This may be because the pool is oversubscribed or no liquidity is available for redemptions. The epoch will be closed and orders executed as soon as the pool state changes or liquidity is provided.">
                    <h5>Locked orders cannot be executed</h5>
                  </Tooltip>
                )}
                {getSolutionState() === 'partial-executions' && (
                  <Tooltip title="The minimum epoch duration has passed but only a fraction of the locked orders could be executed. The epoch is not automatically closed to avoid unsustainable gas fees for small transaction amounts.">
                    <h5>Locked orders can only be partially executed</h5>
                  </Tooltip>
                )}
              </>
            )}
            {epochData?.state === 'in-submission-period' && (
              <Tooltip title="The epoch has been closed and orders are currently being computed. After the computing period has ended the orders will be executed.">
                <h5>Minimum {secondsToHms(epochData?.challengeTime || 0)} remaining</h5>
              </Tooltip>
            )}
            {epochData?.state === 'in-challenge-period' && (
              <Tooltip title="The epoch has been closed and orders are currently being computed. After the computing period has ended the orders will be executed.">
                <h5>
                  {secondsToHms((epochData?.minChallengePeriodEnd || 0) + 60 - new Date().getTime() / 1000)}{' '}
                  remaining...
                </h5>
              </Tooltip>
            )}
            {epochData?.state === 'challenge-period-ended' && (
              <Tooltip title="The epoch has been closed and orders have been computed. The orders will be executed shortly.">
                <h5>To be closed</h5>
              </Tooltip>
            )}
          </LoadingValue>
        </EpochState>
        <Caret style={{ marginLeft: 'auto', position: 'relative', top: '0' }}>
          <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
        </Caret>
      </Box>
      {open && (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell size="40%">Investments</TableCell>
                <TableCell size="20%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                  Locked
                </TableCell>
                <TableCell size="20%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                  To be executed
                </TableCell>
                <TableCell size="20%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                  In %
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>DROP investments</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue done={poolData?.senior?.pendingInvestments !== undefined}>
                    {formatCurrencyAmount(poolData?.senior?.pendingInvestments)}
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue done={solution?.dropInvest !== undefined}>
                    {formatCurrencyAmount(solution?.dropInvest)}
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue
                    done={poolData?.senior?.pendingInvestments !== undefined && solution?.dropInvest !== undefined}
                  >
                    {(poolData?.senior?.pendingInvestments || new BN(0)).isZero()
                      ? '0'
                      : parseFloat(
                          (solution?.dropInvest || new BN(0))
                            .mul(new BN(10).pow(new BN(18)))
                            .div(poolData?.senior?.pendingInvestments || new BN(1))
                            .div(new BN(10).pow(new BN(16)))
                            .toString()
                        )}
                    %
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>TIN investments</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue done={poolData?.junior?.pendingInvestments !== undefined}>
                    {formatCurrencyAmount(poolData?.junior?.pendingInvestments)}
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue done={solution?.tinInvest !== undefined}>
                    {formatCurrencyAmount(solution?.tinInvest)}
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue
                    done={poolData?.junior?.pendingInvestments !== undefined && solution?.tinInvest !== undefined}
                  >
                    {(poolData?.junior?.pendingInvestments || new BN(0)).isZero()
                      ? '0'
                      : parseFloat(
                          (solution?.tinInvest || new BN(0))
                            .mul(new BN(10).pow(new BN(18)))
                            .div(poolData?.junior?.pendingInvestments || new BN(1))
                            .div(new BN(10).pow(new BN(16)))
                            .toString()
                        )}
                    %
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow style={{ fontWeight: 'bold' }}>
                <TableCell border={{ side: 'bottom', color: 'rgba(0, 0, 0, 0.8)' }}>
                  Total pending investments
                </TableCell>
                <TableCell border={{ side: 'bottom', color: 'rgba(0, 0, 0, 0.8)' }} style={{ textAlign: 'right' }}>
                  <LoadingValue done={poolData?.totalPendingInvestments !== undefined}>
                    {formatCurrencyAmount(poolData?.totalPendingInvestments)}
                  </LoadingValue>
                </TableCell>
                <TableCell border={{ side: 'bottom', color: 'rgba(0, 0, 0, 0.8)' }} style={{ textAlign: 'right' }}>
                  <LoadingValue done={solution?.tinInvest !== undefined}>
                    {formatCurrencyAmount((solution?.dropInvest || new BN(0)).add(solution?.tinInvest || new BN(0)))}
                  </LoadingValue>
                </TableCell>
                <TableCell border={{ side: 'bottom', color: 'rgba(0, 0, 0, 0.8)' }} style={{ textAlign: 'right' }}>
                  <LoadingValue
                    done={poolData?.senior?.pendingInvestments !== undefined && solution?.dropInvest !== undefined}
                  >
                    {(poolData?.senior?.pendingInvestments || new BN(0)).isZero() &&
                    (poolData?.junior?.pendingInvestments || new BN(0)).isZero()
                      ? '0'
                      : parseFloat(
                          (solution?.dropInvest || new BN(0))
                            .add(solution?.tinInvest || new BN(0))
                            .mul(new BN(10).pow(new BN(18)))
                            .div(
                              (poolData?.senior?.pendingInvestments || new BN(1)).add(
                                poolData?.junior?.pendingInvestments || new BN(1)
                              )
                            )
                            .div(new BN(10).pow(new BN(16)))
                            .toString()
                        )}
                    %
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
                <TableCell size="20%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                  To be executed
                </TableCell>
                <TableCell size="20%" style={{ textAlign: 'right' }} pad={{ vertical: '6px' }}>
                  In %
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>DROP redemptions</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue done={poolData?.senior?.pendingRedemptions !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.senior?.pendingRedemptions || '0', 18), 0)
                    )}{' '}
                    DROP
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue done={solution?.dropRedeem !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(solution?.dropRedeem || '0', 18), 0))} DROP
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue
                    done={poolData?.senior?.pendingRedemptions !== undefined && solution?.dropRedeem !== undefined}
                  >
                    {(poolData?.senior?.pendingRedemptions || new BN(0)).isZero()
                      ? '0'
                      : parseFloat(
                          (solution?.dropRedeem || new BN(0))
                            .mul(new BN(10).pow(new BN(18)))
                            .div(poolData?.senior?.pendingRedemptions || new BN(1))
                            .div(new BN(10).pow(new BN(16)))
                            .toString()
                        )}
                    %
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>TIN redemptions</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue done={poolData?.junior?.pendingRedemptions !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.junior?.pendingRedemptions || '0', 18), 0)
                    )}{' '}
                    TIN
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue done={solution?.tinRedeem !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(solution?.tinRedeem || '0', 18), 0))} TIN
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <LoadingValue
                    done={poolData?.junior?.pendingRedemptions !== undefined && solution?.tinRedeem !== undefined}
                  >
                    {(poolData?.junior?.pendingRedemptions || new BN(0)).isZero()
                      ? '0'
                      : parseFloat(
                          (solution?.tinRedeem || new BN(0))
                            .mul(new BN(10).pow(new BN(18)))
                            .div(poolData?.junior?.pendingRedemptions || new BN(1))
                            .div(new BN(10).pow(new BN(16)))
                            .toString()
                        )}
                    %
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow style={{ fontWeight: 'bold' }}>
                <TableCell border={{ side: 'bottom', color: 'rgba(0, 0, 0, 0.8)' }}>
                  Total pending redemptions in {props.activePool?.metadata.currencySymbol || 'DAI'}
                </TableCell>
                <TableCell border={{ side: 'bottom', color: 'rgba(0, 0, 0, 0.8)' }} style={{ textAlign: 'right' }}>
                  <LoadingValue done={poolData?.totalRedemptionsCurrency !== undefined}>
                    {formatCurrencyAmount(poolData?.totalRedemptionsCurrency)}
                  </LoadingValue>
                </TableCell>
                <TableCell border={{ side: 'bottom', color: 'rgba(0, 0, 0, 0.8)' }} style={{ textAlign: 'right' }}>
                  <LoadingValue done={solution?.tinInvest !== undefined}>
                    {formatCurrencyAmount(
                      (solution?.dropRedeem || new BN(0))
                        .mul(poolData?.senior?.tokenPrice || new BN(0))
                        .div(Fixed27Base)
                        .add(
                          (solution?.tinRedeem || new BN(0))
                            .mul(poolData?.junior?.tokenPrice || new BN(0))
                            .div(Fixed27Base)
                        )
                    )}
                  </LoadingValue>
                </TableCell>
                <TableCell border={{ side: 'bottom', color: 'rgba(0, 0, 0, 0.8)' }} style={{ textAlign: 'right' }}>
                  <LoadingValue
                    done={poolData?.senior?.pendingRedemptions !== undefined && solution?.dropRedeem !== undefined}
                  >
                    {(poolData?.senior?.pendingRedemptions || new BN(0)).isZero() &&
                    (poolData?.junior?.pendingRedemptions || new BN(0)).isZero()
                      ? '0'
                      : parseFloat(
                          (solution?.dropRedeem || new BN(0))
                            .add(solution?.tinInvest || new BN(0))
                            .mul(new BN(10).pow(new BN(18)))
                            .div(
                              (poolData?.senior?.pendingRedemptions || new BN(1)).add(
                                poolData?.junior?.pendingRedemptions || new BN(1)
                              )
                            )
                            .div(new BN(10).pow(new BN(16)))
                            .toString()
                        )}
                    %
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <br />
          {showEpochButton && (
            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <EpochButton />
            </Box>
          )}
        </TableWrapper>
      )}
    </Box>
  )
}

const EpochState = styled.div`
  display: flex;
  direction: row;
  margin: 2px 0 0 0;

  h3 {
    font-size: 14px;
    margin: 0;
  }

  h4 {
    font-size: 14px;
    margin: 0 0 0 14px;
    color: #777777;
  }

  h5 {
    font-size: 14px;
    margin: 0 0 0 14px;
    color: #777777;
    border-bottom: 1px dashed #777777;
  }
`

const TableWrapper = styled.div`
  margin-left: 44px;
`

export default connect((state) => state, { createTransaction })(EpochOverview)
