import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Pool } from '../../../config'
import { createTransaction, TransactionProps } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { dateToYMD } from '../../../utils/date'
import { getAddressLink } from '../../../utils/etherscanLinkGenerator'
import { Fixed27Base } from '../../../utils/ratios'
import { toPrecision } from '../../../utils/toPrecision'
import { Asset } from '../../../utils/useAsset'
import { useLoan } from '../../../utils/useLoan'
import { RiskGroup, usePool } from '../../../utils/usePool'
import { Button } from '../../Button'
import { ButtonGroup } from '../../ButtonGroup'
import { Card } from '../../Card'
import { useDebugFlags } from '../../DebugFlags'
import { Divider } from '../../Divider'
import { SectionHeading } from '../../Heading'
import { Box, Flex, Shelf, Stack } from '../../Layout'
import { LoadingValue } from '../../LoadingValue'
import { useTinlake } from '../../TinlakeProvider'
import { Tooltip } from '../../Tooltip'
import LoanLabel from '../Label'

interface Props extends TransactionProps {
  loan?: Asset
  poolConfig: Pool
}

const DisplayFieldWrapper = styled.div`
  width: 100%;
  max-width: 200px;
  > div {
    padding: 0;
  }
`

const LoanData: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()

  const { data: poolData } = usePool(props.poolConfig.addresses.ROOT_CONTRACT)

  const riskGroup = React.useMemo(() => {
    if (poolData?.risk) {
      return poolData.risk
        .map((riskGroup: RiskGroup, index: number) => {
          return { ...riskGroup, id: index }
        })
        .filter((riskGroup) => riskGroup.ceilingRatio && !riskGroup.ceilingRatio.isZero())
        .find((riskGroup) => riskGroup.id === props.loan?.riskGroup)
    }
  }, [poolData, props.loan?.riskGroup])

  const { showTransferCurrency } = useDebugFlags()
  const availableForFinancing = props.loan?.debt.isZero() ? props.loan?.principal || new BN(0) : new BN(0)

  const { data: loanData } = useLoan(props.poolConfig.addresses.ROOT_CONTRACT, Number(props.loan?.loanId))

  const appliedRiskAdjustment = React.useMemo(() => {
    if (riskGroup?.recoveryRatePD) {
      return toPrecision(
        (
          parseFloat(
            Fixed27Base.sub(riskGroup?.recoveryRatePD as BN)
              .div(new BN(10).pow(new BN(22)))
              .toString()
          ) / 1000
        ).toString(),
        2
      )
    }
  }, [riskGroup])

  const proxyTransfer = async () => {
    if (!props.loan?.borrower) throw new Error('Borrower field missing')

    await props.createTransaction(`Transfer currency from proxy`, 'proxyTransferCurrency', [
      tinlake,
      props.loan.ownerOf,
      props.loan.borrower,
    ])
  }

  return (
    <>
      <Card p="medium" maxWidth={{ medium: 900 }}>
        <Stack gap="medium">
          <Shelf justifyContent={['space-between', 'flex-start']} gap="small">
            <SectionHeading>Status</SectionHeading>
            <LoadingValue done={!!props.loan} height={28} alignRight={false}>
              {props.loan && <LoanLabel loan={props.loan} />}
            </LoadingValue>
          </Shelf>
          <Flex flexDirection={['column', 'column', 'row']} justifyContent="space-between">
            <Box maxWidth={{ medium: 360 }} flex="1">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Available for financing</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={props.loan?.principal !== undefined}>
                        {addThousandsSeparators(toPrecision(baseToDisplay(availableForFinancing, 18), 2))}{' '}
                        {props.poolConfig.metadata.currencySymbol || 'DAI'}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Outstanding</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={props.loan?.debt !== undefined}>
                        {addThousandsSeparators(toPrecision(baseToDisplay(props.loan?.debt || new BN(0), 18), 2))}{' '}
                        {props.poolConfig.metadata.currencySymbol || 'DAI'}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row" border={{ color: 'transparent' }}>
                      Maturity date
                    </TableCell>
                    <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                      <LoadingValue done={props.loan?.nft?.maturityDate !== undefined}>
                        {dateToYMD(props.loan?.nft?.maturityDate || 0)}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row" border={{ color: 'transparent' }}>
                      Financed by
                    </TableCell>
                    <TableCell style={{ textAlign: 'end', float: 'right' }} border={{ color: 'transparent' }}>
                      <LoadingValue done={!!props.loan} height={24}>
                        {props.loan?.borrower && (
                          <DisplayFieldWrapper>
                            <DisplayField
                              copy={true}
                              as={'span'}
                              value={props.loan?.borrower}
                              link={{
                                href: getAddressLink(props.loan?.borrower),
                                target: '_blank',
                              }}
                            />
                          </DisplayFieldWrapper>
                        )}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Divider display={{ medium: 'none' }} m={0} />
            <Box maxWidth={{ medium: 360 }} flex="1">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Financing fee</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={props.loan?.interestRate !== undefined}>
                        {toPrecision(feeToInterestRate(props.loan?.interestRate || new BN(0)), 2)} %
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Total financed</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={loanData?.borrowsAggregatedAmount !== undefined}>
                        {addThousandsSeparators(
                          toPrecision(baseToDisplay(loanData?.borrowsAggregatedAmount || new BN(0), 18), 2)
                        )}{' '}
                        {props.poolConfig.metadata.currencySymbol || 'DAI'}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Total repaid</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={loanData?.repaysAggregatedAmount !== undefined}>
                        {addThousandsSeparators(
                          toPrecision(baseToDisplay(loanData?.repaysAggregatedAmount || new BN(0), 18), 2)
                        )}{' '}
                        {props.poolConfig.metadata.currencySymbol || 'DAI'}
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Flex>
          {props.loan?.ownerOf && props.loan?.borrower && showTransferCurrency && (
            <ButtonGroup>
              <Button label="Transfer currency from proxy" size="small" onClick={() => proxyTransfer()}></Button>
            </ButtonGroup>
          )}
        </Stack>
      </Card>
      <Card p="medium" maxWidth={{ medium: 900 }}>
        <Stack>
          <Shelf justifyContent={['space-between', 'flex-start']} gap="small">
            <SectionHeading>Risk</SectionHeading>
          </Shelf>
          <Flex flexDirection={['column', 'column', 'row']} justifyContent="space-between">
            <Box maxWidth={{ medium: 360 }} flex="1">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Risk group</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={props.loan?.riskGroup !== undefined}>{props.loan?.riskGroup}</LoadingValue>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Divider display={{ medium: 'none' }} m={0} />
            <Box maxWidth={{ medium: 360 }} flex="1">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">
                      <Tooltip id="appliedRiskAdjustment" underline>
                        Applied risk adjustment
                      </Tooltip>
                    </TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue
                        done={props.loan?.riskGroup !== undefined && riskGroup?.recoveryRatePD !== undefined}
                      >
                        {appliedRiskAdjustment}%
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Flex>
        </Stack>
      </Card>
    </>
  )
}

export default connect(null, { createTransaction })(LoanData)
