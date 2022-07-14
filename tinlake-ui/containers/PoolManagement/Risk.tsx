import {
  baseToDisplay,
  displayToBase,
  feeToInterestRate,
  interestRateToFee,
  ITinlake,
  toPrecision,
} from '@centrifuge/tinlake-js'
import { IRiskGroup, IWriteOffGroup } from '@centrifuge/tinlake-js/dist/actions/admin'
import BN from 'bn.js'
import { Box, Button, FormField, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import Alert from '../../components/Alert'
import { Card } from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import Scorecard from '../../components/Scorecard'
import { Tooltip } from '../../components/Tooltip'
import { Pool } from '../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { Fixed27Base } from '../../utils/ratios'
import { RiskGroup, usePool, WriteOffGroup } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
  activePool: Pool
}

interface RiskGroupWithId extends RiskGroup {
  id: number
}

const riskGroupsPerPage = 8

const isValidRatePerSecond = (rate: BN): boolean => {
  return rate.gt(new BN(interestRateToFee('0'))) && rate.lt(new BN(interestRateToFee('100')))
}

const Risk: React.FC<Props> = (props: Props) => {
  const { data: poolData, refetch: refetchPoolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [start, setStart] = React.useState(0)

  const [riskGroups, setRiskGroups] = React.useState([] as IRiskGroup[])
  const [writeOffGroups, setWriteOffGroups] = React.useState([] as IWriteOffGroup[])

  const existingRiskGroups = poolData?.risk
    ? poolData.risk
        .map((riskGroup: RiskGroup, index: number) => {
          return { ...riskGroup, id: index }
        })
        .filter((riskGroup) => riskGroup.ceilingRatio && !riskGroup.ceilingRatio.isZero())
    : []

  const existingWriteOffGroups = poolData?.writeOffGroups
    ? poolData.writeOffGroups.filter(
        (writeOffGroup) => writeOffGroup.overdueDays && !writeOffGroup.overdueDays.isZero()
      )
    : []

  const [riskGroupStatus, , setRiskGroupTxId] = useTransactionState()

  const addRiskGroup = () => {
    const newRiskGroup = {
      id: existingRiskGroups.length + riskGroups.length,
      ceilingRatio: new BN(0),
      rate: new BN('1000000002378234398782343987'),
      recoveryRatePD: new BN(0),
      thresholdRatio: Fixed27Base,
    }
    setRiskGroups([...riskGroups, newRiskGroup])
  }

  const updateRiskGroup = (group: number, key: 'ceilingRatio' | 'recoveryRatePD' | 'rate', value: string) => {
    const newRiskGroups = riskGroups
    newRiskGroups[group][key] = key === 'rate' ? new BN(interestRateToFee(value)) : new BN(displayToBase(value, 25))
    setRiskGroups(newRiskGroups)
  }

  const saveRiskGroups = async () => {
    const txId = await props.createTransaction(
      `Save ${riskGroups.length} risk group${riskGroups.length > 1 ? 's' : ''}`,
      'addRiskGroups',
      [props.tinlake, [...riskGroups]]
    )
    setRiskGroupTxId(txId)
  }

  React.useEffect(() => {
    if (riskGroupStatus === 'succeeded') {
      refetchPoolData()
    }
  }, [riskGroupStatus])

  const [writeOffGroupStatus, ,] = useTransactionState()

  const addWriteOffGroup = () => {
    const newWriteOffGroup = {
      rate: new BN('1000000002378234398782343987'),
      writeOffPercentage: new BN(0),
      overdueDays: new BN(0),
    }
    setWriteOffGroups([...writeOffGroups, newWriteOffGroup])
  }

  const updateWriteOffGroup = (group: number, key: 'writeOffPercentage' | 'rate' | 'overdueDays', value: string) => {
    const newWriteOffGroups = writeOffGroups
    newWriteOffGroups[group][key] =
      key === 'rate'
        ? new BN(interestRateToFee(value))
        : key === 'overdueDays'
        ? new BN(value)
        : Fixed27Base.sub(new BN(displayToBase(value, 25)))
    setWriteOffGroups(newWriteOffGroups)
  }

  const saveWriteOffGroups = async () => {
    console.log(writeOffGroups[0].writeOffPercentage.toString())
    const txId = await props.createTransaction(
      `Save ${writeOffGroups.length} write-off group${writeOffGroups.length > 1 ? 's' : ''}`,
      'addWriteOffGroups',
      [props.tinlake, [...writeOffGroups]]
    )
    setRiskGroupTxId(txId)
  }

  return poolData && poolData.risk ? (
    <Box>
      <Card p="medium" mb="medium">
        <Heading level="5" margin={{ top: '0' }}>
          Risk groups
        </Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell size="14%">Risk group ID</TableCell>
              <TableCell size="22%">Max advance rate</TableCell>
              <TableCell size="22%">Financing fee (APR)</TableCell>
              <TableCell size="22%">
                <Tooltip id="appliedRiskAdjustment" underline>
                  Applied risk adjustment
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {existingRiskGroups.slice(start, start + riskGroupsPerPage).map((riskGroup: RiskGroupWithId) => (
              <TableRow>
                <TableCell>{riskGroup.id}</TableCell>
                <TableCell>{parseFloat(riskGroup.ceilingRatio.div(new BN(10).pow(new BN(25))).toString())}%</TableCell>
                <TableCell>
                  {isValidRatePerSecond(riskGroup.rate.ratePerSecond)
                    ? `${toPrecision(feeToInterestRate(riskGroup.rate.ratePerSecond), 2)}%`
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {toPrecision(
                    parseFloat(
                      Fixed27Base.sub(riskGroup.recoveryRatePD)
                        .div(new BN(10).pow(new BN(22)))
                        .toString()
                    ) / 1000,
                    2
                  )}
                  %
                </TableCell>
              </TableRow>
            ))}

            {poolData?.adminLevel && poolData.adminLevel >= 2 && (
              <>
                {riskGroups.map((riskGroup: IRiskGroup, id: number) => (
                  <TableRow>
                    <TableCell>{riskGroup.id}</TableCell>
                    <TableCell>
                      <FormField margin={{ right: 'small' }}>
                        <NumberInput
                          value={baseToDisplay(riskGroup.ceilingRatio || new BN(0), 25)}
                          suffix="%"
                          max={100}
                          precision={0}
                          onValueChange={({ value }) => updateRiskGroup(id, 'ceilingRatio', value)}
                          plain
                        />
                      </FormField>
                    </TableCell>
                    <TableCell>
                      <FormField margin={{ right: 'small' }}>
                        <NumberInput
                          value={feeToInterestRate((riskGroup.rate || new BN(0)).toString())}
                          suffix="%"
                          max={100}
                          precision={2}
                          onValueChange={({ value }) => updateRiskGroup(id, 'rate', value)}
                          plain
                        />
                      </FormField>
                    </TableCell>
                    <TableCell>
                      <FormField margin={{ right: 'small' }}>
                        <NumberInput
                          value={baseToDisplay(riskGroup.recoveryRatePD || new BN(0), 25)}
                          suffix="%"
                          max={100}
                          precision={3}
                          onValueChange={({ value }) => updateRiskGroup(id, 'recoveryRatePD', value)}
                          plain
                        />
                      </FormField>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>

        <Box direction="row" justify="center" margin={{ top: 'medium' }} gap="medium">
          <div>
            <Button
              size="small"
              primary
              label="Previous"
              onClick={() => setStart(start - riskGroupsPerPage < 0 ? 0 : start - riskGroupsPerPage)}
              disabled={start === 0}
            />
          </div>
          <div>
            <Button
              size="small"
              primary
              label="Next"
              onClick={() => setStart(start + riskGroupsPerPage)}
              disabled={existingRiskGroups.length < start + riskGroupsPerPage}
            />
          </div>
        </Box>

        {poolData?.adminLevel && poolData.adminLevel >= 2 && (
          <>
            <Alert margin={{ top: 'medium' }} type="info">
              Note: risk groups &amp; write-off groups can only be added, they cannot be edited or removed.
            </Alert>

            <Box margin={{ top: 'medium' }}>
              <div style={{ marginLeft: 'auto' }}>
                <Button secondary label="Add another" onClick={() => addRiskGroup()} margin={{ right: '24px' }} />
                <Button
                  primary
                  label={`Save ${riskGroups.length || ''} risk group${riskGroups.length !== 1 ? 's' : ''}`}
                  onClick={() => saveRiskGroups()}
                  disabled={
                    riskGroups.length === 0 || riskGroupStatus === 'unconfirmed' || riskGroupStatus === 'pending'
                  }
                />
              </div>
            </Box>
          </>
        )}
      </Card>

      {existingWriteOffGroups && existingWriteOffGroups.length > 0 && (
        <Card width="100%" p="medium" mb="medium">
          <Heading level="5" margin={{ top: '0' }}>
            Write-off groups
          </Heading>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell size="5%">#</TableCell>
                <TableCell size="20%">Write-off percentage</TableCell>
                <TableCell size="20%">Financing Fee (APR)</TableCell>
                <TableCell size="20%">Write-off schedule</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {existingWriteOffGroups.map((writeOffGroup: WriteOffGroup, index: number) => (
                <TableRow>
                  <TableCell>{index}</TableCell>
                  <TableCell>
                    {parseFloat(
                      Fixed27Base.sub(writeOffGroup.percentage)
                        .div(new BN(10).pow(new BN(25)))
                        .toString()
                    )}
                    %
                  </TableCell>
                  <TableCell>0.00%</TableCell>
                  <TableCell>
                    {writeOffGroup.overdueDays.toString()} day{writeOffGroup.overdueDays.eqn(1) ? '' : 's'} after
                    maturity
                  </TableCell>
                </TableRow>
              ))}

              {poolData?.adminLevel && poolData.adminLevel >= 2 && (
                <>
                  {writeOffGroups.map((writeOffGroup: IWriteOffGroup, id: number) => (
                    <TableRow>
                      <TableCell>{existingWriteOffGroups.length + id}</TableCell>
                      <TableCell>
                        <FormField margin={{ right: 'small' }}>
                          <NumberInput
                            value={baseToDisplay(Fixed27Base.sub(writeOffGroup.writeOffPercentage || new BN(0)), 25)}
                            suffix="%"
                            max={100}
                            precision={0}
                            onValueChange={({ value }) => updateWriteOffGroup(id, 'writeOffPercentage', value)}
                            plain
                          />
                        </FormField>
                      </TableCell>
                      <TableCell>
                        <FormField margin={{ right: 'small' }}>
                          <NumberInput
                            value={feeToInterestRate((writeOffGroup.rate || new BN(0)).toString())}
                            suffix="%"
                            max={100}
                            precision={2}
                            onValueChange={({ value }) => updateWriteOffGroup(id, 'rate', value)}
                            plain
                          />
                        </FormField>
                      </TableCell>
                      <TableCell>
                        <FormField margin={{ right: 'small' }}>
                          <NumberInput
                            value={(writeOffGroup.overdueDays || new BN(0)).toString()}
                            precision={0}
                            min={1}
                            suffix=" days"
                            onValueChange={({ value }) => updateWriteOffGroup(id, 'overdueDays', value)}
                            plain
                          />
                        </FormField>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>

          {poolData?.adminLevel && poolData.adminLevel >= 2 && (
            <Box margin={{ top: 'medium' }}>
              <div style={{ marginLeft: 'auto' }}>
                <Button secondary label="Add another" onClick={() => addWriteOffGroup()} margin={{ right: '24px' }} />
                <Button
                  primary
                  label={`Save ${writeOffGroups.length || ''} write-off group${writeOffGroups.length !== 1 ? 's' : ''}`}
                  onClick={saveWriteOffGroups}
                  disabled={
                    writeOffGroups.length === 0 ||
                    writeOffGroupStatus === 'unconfirmed' ||
                    writeOffGroupStatus === 'pending'
                  }
                />
              </div>
            </Box>
          )}
        </Card>
      )}

      <Scorecard activePool={props.activePool} />
    </Box>
  ) : null
}

export default connect((state) => state, { createTransaction })(Risk)
