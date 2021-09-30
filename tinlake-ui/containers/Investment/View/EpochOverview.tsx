import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useQuery } from 'react-query'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Button } from '../../../components/Button'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Card } from '../../../components/Card'
import { useDebugFlags } from '../../../components/DebugFlags'
import { Divider } from '../../../components/Divider'
import { SectionHeading } from '../../../components/Heading'
import { Box, Stack } from '../../../components/Layout'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Pool } from '../../../config'
import { AuthState } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Fixed27Base } from '../../../utils/ratios'
import { toPrecision } from '../../../utils/toPrecision'
import { useEpoch } from '../../../utils/useEpoch'
import { useMedia } from '../../../utils/useMedia'
import { usePool } from '../../../utils/usePool'
import EpochOverviewHeader from './EpochOverviewHeader'

interface Props extends TransactionProps {
  auth?: AuthState
  activePool?: Pool
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const EpochOverview: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const tinlake = useTinlake()
  const { showCloseEpoch } = useDebugFlags()
  const { root } = router.query

  const { data: poolData } = usePool(root as string)
  const { data: epochData } = useEpoch()

  const isMobile = useMedia({ below: 'medium' })

  const [status, , setTxId] = useTransactionState()

  const solve = async () => {
    const txId = await props.createTransaction(`Close epoch ${epochData?.id}`, 'solveEpoch', [tinlake])
    setTxId(txId)
  }

  const execute = async () => {
    const txId = await props.createTransaction(`Execute epoch ${epochData?.id}`, 'executeEpoch', [tinlake])
    setTxId(txId)
  }

  const disabled = status === 'unconfirmed' || status === 'pending'

  const [open, setOpen] = React.useState(false)

  const showEpochButton = epochData && (poolData?.isPoolAdmin || showCloseEpoch)

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
      const epochState = await tinlake.getEpochState(true)
      const orders = {
        tinRedeem: poolData?.junior?.pendingRedemptions || new BN(0),
        dropRedeem: poolData?.senior?.pendingRedemptions || new BN(0),
        tinInvest: poolData?.junior?.pendingInvestments || new BN(0),
        dropInvest: poolData?.senior?.pendingInvestments || new BN(0),
      }
      const solution = await tinlake.runSolver(epochState, orders)
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
    <Card interactive>
      <EpochOverviewHeader
        isOpen={open}
        onClick={() => setOpen(!open)}
        epochData={epochData}
        solutionState={solutionState}
      />
      {open && (
        <Box px={24} pb={24}>
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
                    <TableCell border={{ side: 'bottom', color: '#eeeeee' }}>Total pending investments</TableCell>
                    <TableCell border={{ side: 'bottom', color: '#eeeeee' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalInvestLocked}>{tableData.totalInvestLocked}</LoadingValue>
                    </TableCell>
                    <TableCell border={{ side: 'bottom', color: '#eeeeee' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalInvestTBE}>{tableData.totalInvestTBE}</LoadingValue>
                    </TableCell>
                    <TableCell border={{ side: 'bottom', color: '#eeeeee' }} style={{ textAlign: 'right' }}>
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
                    <TableCell border={{ side: 'bottom', color: '#eeeeee' }}>Total pending redemptions</TableCell>
                    <TableCell border={{ side: 'bottom', color: '#eeeeee' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalRedeemLocked}>{tableData.totalRedeemLocked}</LoadingValue>
                    </TableCell>
                    <TableCell border={{ side: 'bottom', color: '#eeeeee' }} style={{ textAlign: 'right' }}>
                      <LoadingValue done={!!tableData.totalRedeemTBE}>{tableData.totalRedeemTBE}</LoadingValue>
                    </TableCell>
                    <TableCell border={{ side: 'bottom', color: '#eeeeee' }} style={{ textAlign: 'right' }}>
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

const TableWrapper = styled.div`
  margin-left: 40px;
  margin-bottom: 24px;
`

const MobileTableHeading = styled.div`
  font-size: 14px;
  font-weight: 500;
`

export default connect((state) => state, { createTransaction })(EpochOverview)
