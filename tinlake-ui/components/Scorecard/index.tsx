import { feeToInterestRate, interestRateToFee, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box as GrommetBox, Button, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import { FormDown, Risk } from 'grommet-icons'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { SectionHeading } from '../../components/Heading'
import { Box, Wrap } from '../../components/Layout'
import { Tooltip } from '../../components/Tooltip'
import { Pool } from '../../config'
import { createTransaction, TransactionProps } from '../../ducks/transactions'
import { Fixed27Base } from '../../utils/ratios'
import { SortableLoan, useAssets } from '../../utils/useAssets'
import { RiskGroup, usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  activePool: Pool
}

interface RiskGroupWithId extends RiskGroup {
  id: number
  outstandingDebt: BN
}

const riskGroupsPerPage = 8

const e18 = new BN(10).pow(new BN(18))

const Scorecard: React.FC<Props> = (props: Props) => {
  const [open, setOpen] = React.useState(false)

  const { data: poolData } = usePool(props.activePool.addresses.ROOT_CONTRACT)
  const { data: assets } = useAssets(props.activePool.addresses.ROOT_CONTRACT)

  const ongoingAssets = assets ? assets.filter((asset) => asset.status && asset.status === 'ongoing') : []

  const outstandingDebtByRiskGroup = (riskGroup: number) => {
    return ongoingAssets.reduce(
      (prev: BN, asset: SortableLoan) =>
        asset.riskGroup !== undefined && asset.riskGroup === riskGroup ? prev.add(asset.debt) : prev,
      new BN(0)
    )
  }

  const totalDebt = ongoingAssets.reduce((sum: BN, asset) => {
    return asset.debt ? sum.add(new BN(asset.debt)) : sum
  }, new BN(0))

  const existingRiskGroups = poolData?.risk
    ? poolData.risk
        .map((riskGroup: RiskGroup, index: number) => {
          return { ...riskGroup, id: index, outstandingDebt: outstandingDebtByRiskGroup(index) }
        })
        .filter(
          (riskGroup: RiskGroupWithId) =>
            riskGroup.ceilingRatio && !riskGroup.ceilingRatio.isZero() && !riskGroup.outstandingDebt.isZero()
        )
        .sort((a: RiskGroupWithId, b: RiskGroupWithId) => {
          return parseFloat(b.outstandingDebt.toString()) - parseFloat(a.outstandingDebt.toString())
        })
    : []

  const [start, setStart] = React.useState(0)

  return (
    <Card interactive>
      <Wrap p={24} gap="small" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <Risk />

        <SectionHeading>Portfolio distribution</SectionHeading>

        <Caret style={{ marginLeft: 'auto', position: 'relative', top: '0' }}>
          <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
        </Caret>
      </Wrap>
      {open && (
        <Box px={24} pb={24}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell size="14%">
                  <Tooltip id="riskGroupID" underline>
                    Risk group ID
                  </Tooltip>
                </TableCell>
                <TableCell size="22%">Financing fee (APR)</TableCell>
                <TableCell size="22%">
                  <Tooltip id="assumedRiskAdjustment" underline>
                    Assumed risk adjustment
                  </Tooltip>
                </TableCell>
                <TableCell size="22%">Portfolio share</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {existingRiskGroups.slice(start, start + riskGroupsPerPage).map((riskGroup: RiskGroupWithId) => (
                <TableRow>
                  <TableCell>{riskGroup.id}</TableCell>
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
                  <TableCell>
                    {toPrecision(
                      parseFloat(
                        (poolData && !poolData.reserve.add(poolData.netAssetValue).isZero()
                          ? riskGroup.outstandingDebt
                              .mul(e18)
                              .div(totalDebt)
                              .div(new BN('10').pow(new BN('14')))
                          : new BN(0)
                        ).toString()
                      ) / 100,
                      2
                    )}
                    %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <GrommetBox direction="row" justify="center" margin={{ top: 'medium' }} gap="medium">
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
          </GrommetBox>
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
