import { feeToInterestRate, interestRateToFee, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Button, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import { FormDown, Risk } from 'grommet-icons'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { SectionHeading } from '../../components/Heading'
import { Box, Wrap } from '../../components/Layout'
import { Pool } from '../../config'
import { createTransaction, TransactionProps } from '../../ducks/transactions'
import { RiskGroup, usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  activePool: Pool
}

const riskGroupsPerPage = 8

const Scorecard: React.FC<Props> = (props: Props) => {
  const [open, setOpen] = React.useState(false)

  const { data: poolData } = usePool(props.activePool.addresses.ROOT_CONTRACT)
  const existingRiskGroups = poolData?.risk
    ? poolData.risk.filter((riskGroup: any) => riskGroup.ceilingRatio && !riskGroup.ceilingRatio.isZero())
    : []

  const [start, setStart] = React.useState(0)

  return (
    <Card interactive>
      <Wrap p={24} gap="small" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <Risk />
        <SectionHeading>Risk Scorecard</SectionHeading>

        <Caret style={{ marginLeft: 'auto', position: 'relative', top: '0' }}>
          <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
        </Caret>
      </Wrap>
      {open && (
        <Box px={24} pb={24}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell size="5%">#</TableCell>
                <TableCell size="20%">Max Advance Rate</TableCell>
                <TableCell size="20%">Financing Fee (APR)</TableCell>
                <TableCell size="20%">Term Recovery Rate</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {existingRiskGroups.slice(start, start + riskGroupsPerPage).map((riskGroup: RiskGroup, index: number) => (
                <TableRow>
                  <TableCell>{start + index}</TableCell>
                  <TableCell>
                    {parseFloat(riskGroup.ceilingRatio.div(new BN(10).pow(new BN(25))).toString())}%
                  </TableCell>
                  <TableCell>
                    {isValidRatePerSecond(riskGroup.rate.ratePerSecond)
                      ? `${toPrecision(feeToInterestRate(riskGroup.rate.ratePerSecond), 2)}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {parseFloat(riskGroup.recoveryRatePD.div(new BN(10).pow(new BN(22))).toString()) / 1000}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
      )}
    </Card>
  )
}

export default connect((state) => state, { createTransaction })(Scorecard)

const isValidRatePerSecond = (rate: BN): boolean => {
  return rate.gt(new BN(interestRateToFee('0'))) && rate.lt(new BN(interestRateToFee('100')))
}

const Caret = styled.div`
  position: relative;
  display: inline-block;
  top: 6px;
  height: 24px;
  margin-left: 10px;
  svg {
    transition: 200ms;
  }
`
