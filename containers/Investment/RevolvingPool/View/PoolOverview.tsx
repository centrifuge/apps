import * as React from 'react'
import { Box, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { useSelector } from 'react-redux'
import { PoolDataV3, PoolState } from '../../../../ducks/pool'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { TINRatioBar } from '../../../../components/TINRatioBar/index'
import {
  TokenLogo,
  BalanceSheetDiagram,
  BalanceSheetDiagramLeft,
  BalanceSheetMidLine,
  BalanceSheetFiller,
  BalanceSheetDiagramRight,
  DividerTop,
  DividerBottom,
  DividerInner,
} from './styles'
import BN from 'bn.js'

interface Props {}

const parseRatio = (num: BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}

const PoolOverview: React.FC<Props> = () => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolDataV3 | undefined

  const poolValue =
    (poolData?.netAssetValue && poolData?.reserve && poolData?.netAssetValue.add(poolData.reserve)) || '0'
  const dropRate = poolData?.senior?.interestRate || '0'

  const dropTotalValue = poolData?.senior && poolData?.senior.totalSupply.mul(poolData.senior!.tokenPrice)

  const tinTotalValue = poolData && poolData.junior.totalSupply.mul(poolData?.junior.tokenPrice)
  const currentJuniorRatio = poolData ? parseRatio(poolData.currentJuniorRatio) : 0
  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : 0
  const maxJuniorRatio = poolData ? parseRatio(poolData.maxJuniorRatio) : 0

  return poolData ? (
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
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.netAssetValue, 18), 2))} DAI
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">Current Reserve</TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.reserve, 18), 2))} DAI
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" border={{ color: 'transparent' }}>
                Maximum Reserve Amount
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.maxReserve, 18), 2))} DAI
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
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.outstandingVolume, 18), 2))} DAI
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" border={{ color: 'transparent' }}>
                <span>
                  <TokenLogo src={`/static/DROP_final.svg`} />
                  DROP APR
                </span>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                {toPrecision(feeToInterestRate(dropRate), 2)} %
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      <BalanceSheetDiagram direction="row">
        <BalanceSheetDiagramLeft>
          <BalanceSheetMidLine>&nbsp;</BalanceSheetMidLine>
          <BalanceSheetFiller>&nbsp;</BalanceSheetFiller>
        </BalanceSheetDiagramLeft>
        <BalanceSheetDiagramRight>&nbsp;</BalanceSheetDiagramRight>
      </BalanceSheetDiagram>

      <Box direction="column" justify="between">
        <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'small' }}>
          <Box direction="row" margin={{ top: '0', bottom: '0' }}>
            <Heading level="5" margin={'0'}>
              <TokenLogo src={`/static/DROP_final.svg`} />
              DROP Value
            </Heading>
            <Box margin={{ left: 'auto' }}>
              <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {dropTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(dropTotalValue, 27 + 18), 2))} DAI
              </Heading>
              <span>
                {poolData.senior &&
                  addThousandsSeparators(toPrecision(baseToDisplay(poolData.senior!.totalSupply, 18), 2))}{' '}
                Token supply @{' '}
                {poolData.senior &&
                  addThousandsSeparators(toPrecision(baseToDisplay(poolData.senior!.tokenPrice, 27), 2))}{' '}
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
          <Box margin={{ left: '20px' }}>
            <TINRatioBar current={currentJuniorRatio} min={minJuniorRatio} max={maxJuniorRatio} />
          </Box>
        </Box>

        <DividerBottom>
          <DividerInner>&nbsp;</DividerInner>
        </DividerBottom>

        <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
          <Box direction="row" margin={{ top: '0', bottom: '0' }}>
            <Heading level="5" margin={'0'}>
              <TokenLogo src={`/static/TIN_final.svg`} />
              TIN Value
            </Heading>
            <Box margin={{ left: 'auto' }}>
              <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {tinTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(tinTotalValue, 27 + 18), 2))} DAI
              </Heading>
              <span>
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.junior.totalSupply, 18), 2))} Token supply @{' '}
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.junior.tokenPrice, 27), 2))} DAI
              </span>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  ) : null
}

export default PoolOverview
