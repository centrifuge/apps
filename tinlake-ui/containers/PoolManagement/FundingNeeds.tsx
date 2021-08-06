import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { useSelector } from 'react-redux'
import Alert from '../../components/Alert'
import { LoadingValue } from '../../components/LoadingValue'
import { Pool } from '../../config'
import { PoolData, PoolState } from '../../ducks/pool'
import { PoolsState } from '../../ducks/pools'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { Fixed27Base } from '../../utils/ratios'
import { toPrecision } from '../../utils/toPrecision'

interface Props {
  activePool: Pool
}

const FundingNeeds: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const pools = useSelector<any, PoolsState>((state) => state.pools)
  const poolListData = pools.data?.pools.find((p) => p.id === props.activePool.addresses.ROOT_CONTRACT)

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

  const makerDropCollateralValue =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? poolData?.maker?.dropBalance.mul(poolData.senior!.tokenPrice).div(new BN(10).pow(new BN(27)))
      : undefined

  const makerOvercollateralization = makerDropCollateralValue
    .mul(new BN(10).pow(new BN(18)))
    .div(poolData?.maker.debt)
    .div(new BN(10).pow(new BN(16)))

  const makerDropShare =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? poolData?.maker?.dropBalance
          .mul(new BN(10).pow(new BN(18)))
          .div(poolData?.senior?.totalSupply)
          .div(new BN(10).pow(new BN(16)))
      : undefined
  return (
    <Box direction="row" width="100%" gap="medium">
      {isMakerIntegrated && (
        <Box
          width="420px"
          pad="medium"
          elevation="small"
          round="xsmall"
          margin={{ bottom: 'medium' }}
          background="white"
        >
          <Table margin={{ bottom: '0' }}>
            <TableBody>
              <TableRow style={{ fontWeight: 'bold' }}>
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
                >
                  Locked Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
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
                >
                  Max Locked Credit Line given TIN
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(maxCreditline, 18 + 6), 1))}M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Available Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
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
                  border={{ color: 'transparent' }}
                >
                  Utilized Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.debt || new BN(0), 18 + 6), 1))}M
                    DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Table margin={{ top: 'medium', bottom: '0' }}>
            <TableBody>
              <TableRow style={{ fontWeight: 'bold' }}>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  Maker Covenants
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  &nbsp;
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Non-Maker DROP holders' share
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={makerDropShare !== undefined}>
                    {100 - parseFloat(makerDropShare || new BN(0).toString())} % &nbsp; &gt; &nbsp; 25%
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
                  Overcollateralization
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={makerDropShare !== undefined}>
                    {parseFloat((makerOvercollateralization || new BN(0)).toString())} % &nbsp; &gt; 105%
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Table margin={{ top: 'medium', bottom: '0' }}>
            <TableBody>
              <TableRow style={{ fontWeight: 'bold' }}>
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
                >
                  Locked for Min TIN Risk Buffer
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
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
                >
                  Locked for Maker Overcollateralization
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
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
                  Unlocked
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
        </Box>
      )}
      <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }} background="white">
        {isMakerIntegrated && (
          <Box margin={{ bottom: 'medium' }}>
            <TokenInput
              label="Maker Capacity"
              token={props.activePool?.metadata.currencySymbol || 'DAI'}
              value={makerCapacity === undefined ? poolData?.maker?.creditline?.toString() || '0' : makerCapacity}
              onChange={onChangeMakerCapacity}
              maxValue={(maxCreditline.lt(debtCeiling) ? maxCreditline : debtCeiling).toString()}
            />
          </Box>
        )}
        <TokenInput
          label="External Investor Capacity"
          token={props.activePool?.metadata.currencySymbol || 'DAI'}
          value={
            externalCapacity === undefined
              ? (poolData?.maxReserve || new BN(0)).sub(poolData?.maker?.remainingCredit || new BN(0)).toString() || '0'
              : externalCapacity
          }
          onChange={onChangeExternalCapacity}
        />

        {poolListData?.capacity?.lt(
          new BN(
            externalCapacity === undefined
              ? (poolData?.maxReserve || new BN(0)).sub(poolData?.maker?.remainingCredit || new BN(0)).toString() || '0'
              : externalCapacity
          )
        ) && (
          <Alert margin={{ top: 'medium' }} type="info">
            The actual investor capacity is currently{' '}
            {addThousandsSeparators(toPrecision(baseToDisplay(poolListData?.capacity || new BN(0), 18), 0))} DAI because
            it's constrained by the TIN Risk Buffer.
          </Alert>
        )}

        <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
          <Button primary label="Save" />
        </Box>
      </Box>
    </Box>
  )
}

export default FundingNeeds
