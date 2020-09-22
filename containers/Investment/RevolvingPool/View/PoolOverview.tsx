import * as React from 'react'
import { Box, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { connect, useSelector } from 'react-redux'
import { loadPool, PoolDataV3, PoolState } from '../../../../ducks/pool'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { TINRatioBar } from '../../../../components/TINRatioBar/index'
import {
  TokenLogo,
  BalanceSheetDiagram,
  BalanceSheetDiagramLeft,
  BalanceSheetMidLine,
  BalanceSheetDiagramRight,
  DividerTop,
  DividerBottom,
  DividerInner,
} from './styles'
import BN from 'bn.js'

interface Props {}

const PoolOverview: React.FC<Props> = () => {
  const pool = useSelector<any, PoolState>((state) => state.pool)

  const poolValue =
    (pool.data !== null &&
      (pool.data as PoolDataV3).netAssetValue &&
      (pool.data as PoolDataV3).reserve &&
      (pool.data as PoolDataV3).netAssetValue.add((pool.data as PoolDataV3).reserve)) ||
    '0'
  const dropRate = (pool.data && pool.data.senior && pool.data.senior.interestRate) || '0'

  const dropTotalValue =
    pool.data &&
    (pool.data as PoolDataV3).senior &&
    (pool.data as PoolDataV3).senior!.totalSupply.mul((pool.data as PoolDataV3).senior!.tokenPrice)

  const tinTotalValue =
    pool.data && (pool.data as PoolDataV3).junior.totalSupply.mul((pool.data as PoolDataV3).junior.tokenPrice)

  const ratioBase = new BN(10).pow(new BN(20))
  const currentJuniorRatio = pool.data ? pool.data.currentJuniorRatio.div(ratioBase).toNumber() / 10 ** 7 : 0
  const minJuniorRatio = pool.data ? pool.data.minJuniorRatio.div(ratioBase).toNumber() / 10 ** 7 : 0
  const maxJuniorRatio = pool.data ? (pool.data as PoolDataV3).maxJuniorRatio.div(ratioBase).toNumber() / 10 ** 7 : 0

  return (
    pool &&
    pool.data && (
      <Box direction="row" justify="between">
        <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
          <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
            <Heading level="5" margin={'0'}>
              Pool Value
            </Heading>
            <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
              {addThousandsSeparators(toPrecision(baseToDisplay(poolValue, 18), 2))} DAI
            </Heading>
          </Box>

          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Current NAV</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay((pool.data as PoolDataV3).netAssetValue, 18), 2))}{' '}
                  DAI
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Current Reserve</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay((pool.data as PoolDataV3).reserve, 18), 2))} DAI
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Maximum Reserve Amount</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay((pool.data as PoolDataV3).maxReserve, 18), 2))} DAI
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Heading level="5" margin={{ bottom: 'small' }}>
            Assets
          </Heading>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Outstanding Volume</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay((pool.data as PoolDataV3).outstandingVolume, 18), 2)
                  )}{' '}
                  DAI
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">
                  <span>
                    <TokenLogo src={`/static/DROP_final.svg`} />
                    DROP APR
                  </span>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>{toPrecision(feeToInterestRate(dropRate), 2)} %</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <BalanceSheetDiagram direction="row">
          <BalanceSheetDiagramLeft>
            <BalanceSheetMidLine>&nbsp;</BalanceSheetMidLine>
          </BalanceSheetDiagramLeft>
          <BalanceSheetDiagramRight>&nbsp;</BalanceSheetDiagramRight>
        </BalanceSheetDiagram>

        <Box direction="column" justify="between">
          <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'small' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                <TokenLogo src={`/static/DROP_final.svg`} />
                DROP Value
              </Heading>
              <Box margin={{ left: 'auto' }}>
                <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                  {dropTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(dropTotalValue, 27 + 18), 2))} DAI
                </Heading>
                <span>
                  {(pool.data as PoolDataV3).senior &&
                    addThousandsSeparators(
                      toPrecision(baseToDisplay((pool.data as PoolDataV3).senior!.totalSupply, 18), 2)
                    )}{' '}
                  Token supply @{' '}
                  {(pool.data as PoolDataV3).senior &&
                    addThousandsSeparators(
                      toPrecision(baseToDisplay((pool.data as PoolDataV3).senior!.tokenPrice, 27), 2)
                    )}{' '}
                  DAI
                </span>
              </Box>
            </Box>
          </Box>

          <DividerTop>
            <DividerInner>&nbsp;</DividerInner>
          </DividerTop>

          <Box margin={{ top: 'small', bottom: 'large' }}>
            <Heading level="5" margin={{ top: 'none', bottom: '28px', left: 'auto', right: 'auto' }}>
              TIN Risk Buffer
            </Heading>
            <Box margin={{ horizontal: '20px' }}>
              <TINRatioBar current={currentJuniorRatio} min={minJuniorRatio} max={maxJuniorRatio} />
            </Box>
          </Box>

          <DividerBottom>
            <DividerInner>&nbsp;</DividerInner>
          </DividerBottom>

          <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                <TokenLogo src={`/static/TIN_final.svg`} />
                TIN Value
              </Heading>
              <Box margin={{ left: 'auto' }}>
                <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                  {tinTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(tinTotalValue, 27 + 18), 2))} DAI
                </Heading>
                <span>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay((pool.data as PoolDataV3).junior.totalSupply, 18), 2)
                  )}{' '}
                  Token supply @{' '}
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay((pool.data as PoolDataV3).junior.tokenPrice, 27), 2)
                  )}{' '}
                  DAI
                </span>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  )
}

export default connect((state) => state, { loadPool })(PoolOverview)
