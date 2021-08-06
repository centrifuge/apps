import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { LoadingValue } from '../../components/LoadingValue'
import { Pool } from '../../config'
import { PoolData, PoolState } from '../../ducks/pool'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { Fixed27Base } from '../../utils/ratios'
import { toPrecision } from '../../utils/toPrecision'

interface Props {
  activePool: Pool
}

const FundingNeeds: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const isMakerIntegrated =
    props.activePool.addresses.CLERK !== undefined && props.activePool.metadata.maker?.ilk !== ''

  const [makerCapacity, setMakerCapacity] = React.useState<string | undefined>(undefined)

  const onChangeMakerCapacity = (newValue: string) => {
    setMakerCapacity(newValue)
  }

  const [externalCapacity, setExternalCapacity] = React.useState<string | undefined>(undefined)

  const onChangeExternalCapacity = (newValue: string) => {
    setExternalCapacity(newValue)
  }

  // TODO: refactor
  const mat = poolData?.maker?.mat

  const debtCeiling = (poolData?.maker?.line || new BN('0')).div(new BN(10).pow(new BN(45 - 18)))
  const maxRaise = mat
    ? (poolData?.netAssetValue || new BN(0))
        .add(poolData?.reserveAndRemainingCredit || new BN(0))
        .mul(Fixed27Base.sub(poolData?.minJuniorRatio || new BN(0)))
        .div(Fixed27Base)
        .sub(poolData?.senior?.debt || new BN(0))
        .sub(poolData?.senior?.balance || new BN(0))
        .div(
          (mat || new BN(0))
            .sub(Fixed27Base)
            .sub(Fixed27Base)
            .mul(Fixed27Base.sub(poolData?.minJuniorRatio || new BN(0)))
            .div(Fixed27Base)
            .add(Fixed27Base)
            .div(new BN(10).pow(new BN(27 - 18)))
        )
        .mul(new BN(10).pow(new BN(27 + 18)))
        .div(mat || new BN(0))
    : new BN(0)

  const maxCreditline = (poolData?.maker?.creditline || new BN(0)).add(maxRaise)

  return (
    <Box direction="row" width="100%" gap="medium">
      <Box basis="1/2" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }} background="white">
        {isMakerIntegrated && (
          <Table margin={{ bottom: '0' }}>
            <TableBody>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  Debt Ceiling
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.line || new BN(0), 45 + 6), 1))}M
                    DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  — Locked Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.creditline !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.maker?.creditline || new BN(0), 18 + 6), 1)
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  — Available Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.maker?.remainingCredit || new BN(0), 18 + 6), 1)
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  — Utilized Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.debt || new BN(0), 18 + 6), 1))}M
                    DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}

        <Table margin={{ bottom: '0' }}>
          <TableBody>
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
                border={{ color: 'transparent' }}
              >
                Available for Originations
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                <LoadingValue done={poolData?.maker.line !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.availableFunds || new BN(0), 18 + 6), 1))}
                  M DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {isMakerIntegrated && (
          <Table margin={{ top: 'medium', bottom: '0' }}>
            <TableBody>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  TIN Tranche Value
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.junior.totalSupply.mul(poolData?.junior.tokenPrice) || new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  — Locked for min TIN risk buffer
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.creditline !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.minJuniorRatio) || new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  — Locked for Maker Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.maker?.mat.sub(Fixed27Base)) ||
                            new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  — Unlocked
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.junior.totalSupply
                            .mul(poolData?.junior.tokenPrice)
                            ?.sub(poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.minJuniorRatio))
                            .sub(
                              poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.maker?.mat.sub(Fixed27Base))
                            ) || new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Box>
      <Box basis="1/2" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }} background="white">
        <TokenInput
          label="Maker Capacity"
          token={props.activePool?.metadata.currencySymbol || 'DAI'}
          value={makerCapacity === undefined ? poolData?.maker?.creditline?.toString() || '0' : makerCapacity}
          onChange={onChangeMakerCapacity}
          maxValue={(maxCreditline.lt(debtCeiling) ? maxCreditline : debtCeiling).toString()}
        />
        <br />
        <br />
        <TokenInput
          label="External Investor Capacity"
          token={props.activePool?.metadata.currencySymbol || 'DAI'}
          value={
            externalCapacity === undefined
              ? poolData?.maxReserve?.sub(poolData?.maker?.remainingCredit).toString() || '0'
              : externalCapacity
          }
          onChange={onChangeExternalCapacity}
        />

        <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
          <Button primary label="Save" />
        </Box>
      </Box>
    </Box>
  )
}

export default FundingNeeds
