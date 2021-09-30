import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { LoadingValue } from '../../components/LoadingValue'
import { useTinlake } from '../../components/TinlakeProvider'
import { Pool } from '../../config'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { Fixed27Base } from '../../utils/ratios'
import { toPrecision } from '../../utils/toPrecision'
import { useAssets } from '../../utils/useAssets'
import { usePool } from '../../utils/usePool'

interface Props {
  activePool: Pool
}

const e18 = new BN(10).pow(new BN(18))

const parseRatio = (num: BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}

const ONE_MILLION = new BN('1000000000000000000000000')

const formatAmount = (amount: BN): string => {
  if (amount.gte(ONE_MILLION)) {
    return `${addThousandsSeparators(toPrecision(baseToDisplay(amount, 24), 2))}M`
  }
  return `${addThousandsSeparators(toPrecision(baseToDisplay(amount, 21), 0))}K`
}

const PoolStatus: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const isMakerIntegrated =
    props.activePool.addresses.CLERK !== undefined && props.activePool.metadata.maker?.ilk !== ''

  // TODO: refactor
  const makerDropCollateralValue =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? poolData?.maker?.dropBalance.mul(poolData.senior!.tokenPrice).div(new BN(10).pow(new BN(27)))
      : undefined

  const makerOvercollateralization =
    isMakerIntegrated &&
    poolData?.maker &&
    poolData?.maker?.dropBalance &&
    poolData.senior &&
    poolData?.maker.debt.gtn(0)
      ? makerDropCollateralValue
          .mul(new BN(10).pow(new BN(18)))
          .div(poolData?.maker.debt)
          .div(new BN(10).pow(new BN(16)))
      : new BN(0)

  const makerDropShare =
    isMakerIntegrated &&
    poolData?.maker &&
    poolData?.maker?.dropBalance &&
    poolData.senior &&
    poolData?.senior?.totalSupply.gtn(0)
      ? poolData?.maker?.dropBalance
          .mul(new BN(10).pow(new BN(18)))
          .div(poolData?.senior?.totalSupply)
          .div(new BN(10).pow(new BN(16)))
      : undefined

  const { data: assets } = useAssets(tinlake.contractAddresses.ROOT_CONTRACT!)
  const ongoingAssets = assets ? assets.filter((asset) => asset.status && asset.status === 'ongoing') : undefined
  const maxSingleLoan = ongoingAssets
    ? ongoingAssets
        .filter((asset) => asset.maturityDate && asset.financingDate)
        .reduce((currentMax: BN, asset) => {
          return asset.debt.gt(currentMax) ? asset.debt : currentMax
        }, new BN(0))
    : new BN(0)

  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined

  const reserveRatio =
    poolData && !poolData.reserve.add(poolData.netAssetValue).isZero()
      ? poolData.reserve
          .mul(e18)
          .div(poolData.reserve.add(poolData.netAssetValue))
          .div(new BN('10').pow(new BN('14')))
      : new BN(0)

  return (
    <Box direction="row" width="100%" gap="medium" margin={{ top: 'medium' }}>
      <Card flexBasis="50%" p="medium" mb="medium">
        <Heading level="5" margin={{ top: '0', bottom: 'small' }}>
          TIN breakdown
        </Heading>
        <Table margin={{ top: '0', bottom: '0' }}>
          <TableBody>
            <TableRow style={{ fontWeight: 'bold' }}>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
                border={{ color: 'transparent' }}
              >
                Total TIN Tranche Value
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                <LoadingValue done={poolData?.junior.totalSupply !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(
                      baseToDisplay(
                        poolData?.junior.totalSupply.mul(poolData?.junior.tokenPrice) || new BN(0),
                        27 + 18 + 6
                      ),
                      1
                    )
                  )}
                  M {props.activePool?.metadata.currencySymbol || 'DAI'}
                </LoadingValue>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                {toPrecision(
                  (
                    Math.round(
                      parseRatio(
                        !(poolData?.netAssetValue && poolData?.reserve) ||
                          (poolData?.netAssetValue.isZero() && poolData?.reserve.isZero())
                          ? new BN(0)
                          : (poolData?.junior.totalSupply || new BN(0))
                              .mul(poolData?.junior.tokenPrice || new BN(0))
                              .div((poolData?.netAssetValue || new BN(0)).add(poolData?.reserve || new BN(0)))
                      ) * 10000
                    ) / 100
                  ).toString(),
                  2
                )}
                %
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
              >
                Min TIN Risk Buffer
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                <LoadingValue done={poolData?.netAssetValue !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(
                      baseToDisplay(
                        poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.minJuniorRatio) || new BN(0),
                        27 + 18 + 6
                      ),
                      1
                    )
                  )}
                  M {props.activePool?.metadata.currencySymbol || 'DAI'}
                </LoadingValue>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                {toPrecision((Math.round((minJuniorRatio || 0) * 10000) / 100).toString(), 2)}%
              </TableCell>
            </TableRow>

            {isMakerIntegrated && (
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Staked for Maker Overcollateralization
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={poolData?.maker?.mat !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.maker?.creditline.mul(poolData?.maker?.mat.sub(Fixed27Base)) || new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M {props.activePool?.metadata.currencySymbol || 'DAI'}
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  {toPrecision(
                    (
                      Math.round(
                        parseRatio(
                          poolData?.maker?.creditline && poolData?.netAssetValue.add(poolData?.reserve).gtn(0)
                            ? (poolData?.maker?.creditline.mul(poolData?.maker?.mat.sub(Fixed27Base)) || new BN(0)).div(
                                poolData?.netAssetValue.add(poolData?.reserve) || new BN(0)
                              )
                            : new BN(0)
                        ) * 10000
                      ) / 100
                    ).toString(),
                    2
                  )}
                  %
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
                border={{ color: 'transparent' }}
              >
                Available TIN
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                <LoadingValue done={poolData?.junior.totalSupply !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(
                      baseToDisplay(
                        poolData?.junior.totalSupply
                          .mul(poolData?.junior.tokenPrice)
                          ?.sub(poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.minJuniorRatio))
                          .sub(
                            (poolData?.maker?.creditline || new BN(0)).mul(
                              (poolData?.maker?.mat || Fixed27Base).sub(Fixed27Base)
                            )
                          ) || new BN(0),
                        27 + 18 + 6
                      ),
                      1
                    )
                  )}
                  M {props.activePool?.metadata.currencySymbol || 'DAI'}
                </LoadingValue>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                {toPrecision(
                  !(poolData?.netAssetValue && poolData?.reserve) ||
                    (poolData?.netAssetValue.isZero() && poolData?.reserve.isZero())
                    ? '0'
                    : (
                        Math.round(
                          (parseRatio(
                            (poolData?.junior.totalSupply.mul(poolData?.junior.tokenPrice) || new BN(0)).div(
                              poolData?.netAssetValue.add(poolData?.reserve) || new BN(0)
                            )
                          ) -
                            (minJuniorRatio || 0) -
                            parseRatio(
                              (
                                (poolData?.maker?.creditline || new BN(0)).mul(
                                  (poolData?.maker?.mat || Fixed27Base).sub(Fixed27Base)
                                ) || new BN(0)
                              ).div(poolData?.netAssetValue.add(poolData?.reserve) || new BN(0))
                            )) *
                            10000
                        ) / 100
                      ).toString(),
                  2
                )}
                %
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
      {isMakerIntegrated && (
        <Card flexBasis="50%" p="medium" mb="medium">
          <Table margin={{ top: '0', bottom: '0' }}>
            <TableBody>
              <TableRow style={{ fontWeight: 'bold' }}>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  <Heading level="5" margin={{ top: '0', bottom: '0' }}>
                    Maker Covenants
                  </Heading>
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
                  Co-investors ratio
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={makerDropShare !== undefined}>
                    {100 - parseFloat(makerDropShare || new BN(0).toString())}%
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={makerDropShare !== undefined}>
                    <SubNote>Min: 25%</SubNote>
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Vault Overcollateralization
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={makerOvercollateralization !== undefined}>
                    {parseFloat((makerOvercollateralization || new BN(0)).toString())}%
                  </LoadingValue>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={makerOvercollateralization !== undefined}>
                    <SubNote>
                      Min:{' '}
                      {parseFloat(
                        (poolData?.maker?.mat || new BN(0))
                          .sub(poolData?.maker?.matBuffer || new BN(0))
                          .div(new BN(10).pow(new BN(25)))
                      ).toString()}
                      %
                    </SubNote>
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
                  Largest outstanding loan
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={maxSingleLoan !== undefined}>
                    {formatAmount(maxSingleLoan)} {props.activePool?.metadata.currencySymbol || 'DAI'}
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      )}

      {!isMakerIntegrated && (
        <Card flexBasis="50%" p="medium" mb="medium">
          <Heading level="5" margin={{ top: '0', bottom: '0' }}>
            Pool Reserve
          </Heading>
          <Table margin={{ top: '0', bottom: '0' }}>
            <TableBody>
              <TableRow style={{ fontWeight: 'bold' }}>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  Current reserve
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.reserve || new BN(0), 18), 0))}{' '}
                  {props.activePool?.metadata.currencySymbol || 'DAI'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Reserve ratio
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={reserveRatio !== undefined}>
                    {parseFloat(reserveRatio.toString()) / 100}%
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
                  Max reserve
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maxReserve !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maxReserve || new BN(0), 18 + 6), 1))}M{' '}
                    {props.activePool?.metadata.currencySymbol || 'DAI'}
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  )
}

export default PoolStatus

const SubNote = styled.span`
  font-weight: 500;
  font-size: 12px;
  margin-left: 6px;
  color: #979797;
`
