import { baseToDisplay, feeToInterestRate, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import { IRiskGroup } from '@centrifuge/tinlake-js/dist/actions/admin'
import BN from 'bn.js'
import { ethers } from 'ethers'
import { Box, Button, FormField, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Card } from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { Fixed27Base } from '../../utils/ratios'
import { RiskGroup, usePool, WriteOffGroup } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const Risk: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [riskGroups, setRiskGroups] = React.useState([] as IRiskGroup[])

  const existingRiskGroups = poolData?.risk
    ? poolData.risk.filter((riskGroup) => riskGroup.ceilingRatio && !riskGroup.ceilingRatio.isZero())
    : []

  const [riskGroupStatus, , setRiskGroupTxId] = useTransactionState()

  const add = () => {
    let newRiskGroups = riskGroups
    newRiskGroups[riskGroups.length] = {
      id: existingRiskGroups.length,
      ceilingRatio: new BN(0),
      rate: new BN(0),
      recoveryRatePD: new BN(0),
      thresholdRatio: new BN(0),
    }
    setRiskGroups(newRiskGroups)
  }

  const update = (group: number, key: 'ceilingRatio' | 'recoveryRatePD' | 'rate' | 'thresholdRatio', value: string) => {
    let newRiskGroups = riskGroups
    newRiskGroups[group][key] = new BN(value).mul(new BN(10)).pow(new BN(25))
    setRiskGroups(newRiskGroups)
  }

  const save = async () => {
    const txId = await props.createTransaction(`Add risk groups`, 'addRiskGroups', [
      props.tinlake,
      JSON.parse(JSON.stringify(riskGroups)),
    ])
    setRiskGroupTxId(txId)
  }

  const getEvents = async () => {
    console.log('get events')
    const poolAdmin = props.tinlake.contract('POOL_ADMIN')
    console.log(poolAdmin.filters)
    const eventFilter = poolAdmin.filters.AddRiskGroup()
    const events = await poolAdmin.queryFilter(eventFilter)

    events
      .filter((e) => e !== undefined)
      .map((log) => {
        return poolAdmin.interface.parseLog(log)
      })
      .forEach((log: ethers.utils.LogDescription) => {
        console.log(`${log.name}`)
        log.args.forEach((arg: any) => {
          console.log(`- ${arg.toString()}`)
        })
      })
  }

  React.useEffect(() => {
    getEvents()
  }, [])

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
              <TableCell size="20%" pad={{ vertical: '6px' }}>
                Threshold Rate
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
                <TableCell>
                  {parseFloat(riskGroup.thresholdRatio.div(new BN(10).pow(new BN(22))).toString()) / 1000}%
                </TableCell>
              </TableRow>
            ))}

            {poolData?.adminLevel && poolData.adminLevel >= 2 && riskGroups[0] && (
              <TableRow>
                <TableCell>{existingRiskGroups.length}</TableCell>
                <TableCell>
                  <FormField margin={{ right: 'small' }}>
                    <NumberInput
                      value={baseToDisplay(riskGroups[0]?.ceilingRatio || new BN(0), 25)}
                      suffix="%"
                      max={100}
                      precision={0}
                      onValueChange={({ value }) => update(0, 'ceilingRatio', value)}
                      plain
                    />
                  </FormField>
                </TableCell>
                <TableCell>
                  <FormField margin={{ right: 'small' }}>
                    <NumberInput
                      value={baseToDisplay(riskGroups[0]?.rate || new BN(0), 25)}
                      suffix="%"
                      max={100}
                      precision={2}
                      onValueChange={({ value }) => update(0, 'rate', value)}
                      plain
                    />
                  </FormField>
                </TableCell>
                <TableCell>
                  <FormField margin={{ right: 'small' }}>
                    <NumberInput
                      value={baseToDisplay(riskGroups[0]?.recoveryRatePD || new BN(0), 25)}
                      suffix="%"
                      max={100}
                      precision={3}
                      onValueChange={({ value }) => update(0, 'recoveryRatePD', value)}
                      plain
                    />
                  </FormField>
                </TableCell>
                <TableCell>
                  <FormField margin={{ right: 'small' }}>
                    <NumberInput
                      value={baseToDisplay(riskGroups[0]?.thresholdRatio || new BN(0), 25)}
                      suffix="%"
                      max={100}
                      precision={0}
                      onValueChange={({ value }) => update(0, 'thresholdRatio', value)}
                      plain
                    />
                  </FormField>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {poolData?.adminLevel && poolData.adminLevel >= 2 && (
          <Box margin={{ top: 'medium' }}>
            <div style={{ marginLeft: 'auto' }}>
              <Button secondary label="Add" onClick={() => add()} margin={{ right: '24px' }} />
              <Button
                primary
                label="Save risk groups"
                onClick={() => save()}
                disabled={riskGroupStatus === 'unconfirmed' || riskGroupStatus === 'pending'}
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
