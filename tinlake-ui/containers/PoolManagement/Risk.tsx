import {
  baseToDisplay,
  displayToBase,
  feeToInterestRate,
  interestRateToFee,
  ITinlake,
  toPrecision,
} from '@centrifuge/tinlake-js'
import { IRiskGroup } from '@centrifuge/tinlake-js/dist/actions/admin'
import BN from 'bn.js'
import { Box, Button, FormField, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import Alert from '../../components/Alert'
import { Card } from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { Fixed27Base } from '../../utils/ratios'
import { RiskGroup, usePool, WriteOffGroup } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const Risk: React.FC<Props> = (props: Props) => {
  const { data: poolData, refetch: refetchPoolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [riskGroups, setRiskGroups] = React.useState([] as IRiskGroup[])

  const existingRiskGroups = poolData?.risk
    ? poolData.risk.filter((riskGroup) => riskGroup.ceilingRatio && !riskGroup.ceilingRatio.isZero())
    : []

  const [riskGroupStatus, , setRiskGroupTxId] = useTransactionState()

  const add = () => {
    const newRiskGroup = {
      id: existingRiskGroups.length + riskGroups.length,
      ceilingRatio: new BN(0),
      rate: new BN('1000000002378234398782343987'),
      recoveryRatePD: new BN(0),
      thresholdRatio: Fixed27Base,
    }
    setRiskGroups([...riskGroups, newRiskGroup])
  }

  const update = (group: number, key: 'ceilingRatio' | 'recoveryRatePD' | 'rate', value: string) => {
    let newRiskGroups = riskGroups
    newRiskGroups[group][key] = key === 'rate' ? new BN(interestRateToFee(value)) : new BN(displayToBase(value, 25))
    setRiskGroups(newRiskGroups)
  }

  const save = async () => {
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

  return poolData && poolData.risk && poolData.writeOffGroups ? (
    <Box>
      <Card p="medium" mb="medium">
        <Heading level="5" margin={{ top: '0' }}>
          Risk groups
        </Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell size="5%">#</TableCell>
              <TableCell size="20%" pad={{ vertical: '6px' }}>
                Max Advance Rate
              </TableCell>
              <TableCell size="20%" pad={{ vertical: '6px' }}>
                Financing Fee (APR)
              </TableCell>
              <TableCell size="20%" pad={{ vertical: '6px' }}>
                Term Recovery Rate
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {existingRiskGroups.map((riskGroup: RiskGroup, index: number) => (
              <TableRow>
                <TableCell>{index}</TableCell>
                <TableCell>{parseFloat(riskGroup.ceilingRatio.div(new BN(10).pow(new BN(25))).toString())}%</TableCell>
                <TableCell>{toPrecision(feeToInterestRate(riskGroup.rate.ratePerSecond), 2)}%</TableCell>
                <TableCell>
                  {parseFloat(riskGroup.recoveryRatePD.div(new BN(10).pow(new BN(22))).toString()) / 1000}%
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
                          onValueChange={({ value }) => update(id, 'ceilingRatio', value)}
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
                          onValueChange={({ value }) => update(id, 'rate', value)}
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
                          onValueChange={({ value }) => update(id, 'recoveryRatePD', value)}
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

        <Alert margin={{ top: 'medium' }} type="info">
          Note: risk groups &amp; write-off groups can only be added, they cannot be edited or removed.
        </Alert>

        {poolData?.adminLevel && poolData.adminLevel >= 2 && (
          <Box margin={{ top: 'medium' }}>
            <div style={{ marginLeft: 'auto' }}>
              <Button secondary label="Add another" onClick={() => add()} margin={{ right: '24px' }} />
              <Button
                primary
                label={`Save ${riskGroups.length} risk group${riskGroups.length !== 1 ? 's' : ''}`}
                onClick={() => save()}
                disabled={riskGroups.length === 0 || riskGroupStatus === 'unconfirmed' || riskGroupStatus === 'pending'}
              />
            </div>
          </Box>
        )}
      </Card>

      <Card width="100%" p="medium" mb="medium">
        <Heading level="5" margin={{ top: '0' }}>
          Write-off groups
        </Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell size="5%">#</TableCell>
              <TableCell size="20%" pad={{ vertical: '6px' }}>
                Write-off percentage
              </TableCell>
              <TableCell size="20%" pad={{ vertical: '6px' }}>
                Financing Fee (APR)
              </TableCell>
              <TableCell size="20%" pad={{ vertical: '6px' }}>
                Overdue days
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {poolData.writeOffGroups
              .filter((writeOffGroup) => writeOffGroup.percentage && !writeOffGroup.percentage.isZero())
              .map((writeOffGroup: WriteOffGroup, index: number) => (
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
                  <TableCell>{writeOffGroup.overdueDays.toString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  ) : null
}

export default connect((state) => state, { createTransaction })(Risk)
