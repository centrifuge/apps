import { feeToInterestRate, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Card } from '../../components/Card'
import { createTransaction, TransactionProps } from '../../ducks/transactions'
import { Fixed27Base } from '../../utils/ratios'
import { RiskGroup, usePool, WriteOffGroup } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const Risk: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  return poolData && poolData.risk && poolData.writeOffGroups ? (
    <Box gap="medium" width="100%">
      <Card width="100%" p="medium" mb="medium">
        <Heading level="4" margin={{ top: '0' }}>
          Risk groups
        </Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell size="5%">#</TableCell>
              <TableCell pad={{ vertical: '6px' }}>Max Advance Rate</TableCell>
              <TableCell pad={{ vertical: '6px' }}>Financing Fee (APR)</TableCell>
              <TableCell pad={{ vertical: '6px' }}>Term Recovery Rate</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {poolData.risk
              .filter((riskGroup) => riskGroup.ceilingRatio && !riskGroup.ceilingRatio.isZero())
              .map((riskGroup: RiskGroup, index: number) => (
                <TableRow>
                  <TableCell>{index}</TableCell>
                  <TableCell>
                    {parseFloat(riskGroup.ceilingRatio.div(new BN(10).pow(new BN(25))).toString())}%
                  </TableCell>
                  <TableCell>{toPrecision(feeToInterestRate(riskGroup.rate.ratePerSecond), 2)}%</TableCell>
                  <TableCell>
                    {parseFloat(riskGroup.recoveryRatePD.div(new BN(10).pow(new BN(22))).toString()) / 1000}%
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <Card width="100%" p="medium" mb="medium">
        <Heading level="4" margin={{ top: '0' }}>
          Write-off groups
        </Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell size="5%">#</TableCell>
              <TableCell pad={{ vertical: '6px' }}>Write-off percentage</TableCell>
              <TableCell pad={{ vertical: '6px' }}>Financing Fee (APR)</TableCell>
              <TableCell pad={{ vertical: '6px' }}>Overdue days</TableCell>
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
