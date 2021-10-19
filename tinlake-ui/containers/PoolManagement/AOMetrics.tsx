import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Heading } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { Shelf } from '../../components/Layout'
import { Pool } from '../../config'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { useTrancheYield } from '../../utils/hooks'
import { toPrecision } from '../../utils/toPrecision'
import { useAssets } from '../../utils/useAssets'
import { usePool } from '../../utils/usePool'

interface Props {
  activePool: Pool
}

const AOMetrics: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.activePool.addresses.ROOT_CONTRACT)

  const { dropYield, tinYield } = useTrancheYield(props.activePool.addresses.ROOT_CONTRACT)
  const dropRate = poolData?.senior?.interestRate || undefined

  const { data: assets } = useAssets(props.activePool.addresses.ROOT_CONTRACT)
  const ongoingAssets = assets ? assets.filter((asset) => asset.status && asset.status === 'ongoing') : undefined
  const outstandingDebt = ongoingAssets
    ? ongoingAssets
        .filter((asset) => asset.maturityDate && asset.financingDate)
        .reduce((current: BN, asset) => {
          return current.add(asset.debt)
        }, new BN(0))
    : new BN(0)
  const repaymentsDue = ongoingAssets
    ? ongoingAssets
        .filter((asset) => asset.maturityDate && asset.financingDate)
        .reduce((current: BN, asset) => {
          return asset.maturityDate && asset.maturityDate <= new Date().setDate(new Date().getDate() + 7) / 1000
            ? current.add(asset.debt)
            : current
        }, new BN(0))
    : new BN(0)

  return (
    <Shelf
      p="small"
      as={Card}
      gap={[0, 0, 'medium']}
      flexDirection={['column', 'column', 'row']}
      alignItems={['flex-start', 'flex-start', 'center']}
    >
      <HeaderBox style={{ borderRight: 'none' }}>
        <Heading level="4">
          <TokenLogo src={`/static/currencies/${props.activePool.metadata.currencySymbol}.svg`} />
          {addThousandsSeparators(
            toPrecision(
              baseToDisplay((poolData?.netAssetValue || new BN(0)).add(poolData?.reserve || new BN(0)), 18),
              0
            )
          )}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Pool Value</Type>
      </HeaderBox>
      <HeaderBox>
        <Heading level="4">
          <TokenLogo src={`/static/currencies/${props.activePool.metadata.currencySymbol}.svg`} />
          {addThousandsSeparators(toPrecision(baseToDisplay(outstandingDebt, 18), 0))}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Outstanding Debt</Type>
      </HeaderBox>
      <HeaderBox style={tinYield ? { borderRight: 'none' } : undefined}>
        <Heading level="4">
          <TokenLogo src={`/static/DROP_final.svg`} />
          {dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0))
            ? dropYield
            : toPrecision(feeToInterestRate(dropRate || '0'), 2)}
          <Unit>%</Unit>
        </Heading>
        {dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0)) && (
          <Box>
            <Type>Senior APY (30 days)</Type>
          </Box>
        )}
        {!(dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0))) && (
          <Box>
            <Type>Fixed senior rate (APR)</Type>
          </Box>
        )}
      </HeaderBox>
      {tinYield && (
        <HeaderBox pad={{ right: 'large' }}>
          <Heading level="4">
            <TokenLogo src={`/static/TIN_final.svg`} />
            {tinYield}
            <Unit>%</Unit>
          </Heading>
          <Box>
            <Type>Junior APY (3 months)</Type>
          </Box>
        </HeaderBox>
      )}
      <HeaderBox style={{ borderRight: 'none' }}>
        <Heading level="4">
          <TokenLogo src={`/static/currencies/${props.activePool.metadata.currencySymbol}.svg`} />
          {addThousandsSeparators(toPrecision(baseToDisplay(repaymentsDue, 18), 0))}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Repayments Due (7 days)</Type>
      </HeaderBox>
    </Shelf>
  )
}

export default AOMetrics

const HeaderBox = styled(Box)<{ width?: string }>`
  text-align: center;
  border-right: 1px solid #dadada;
  width: ${(props) => props.width || '260px'};
  flex-direction: column;
  justify-content: center;
  padding: 10px 0 10px 0;
  height: 80px;

  h3,
  h4,
  h5,
  h6 {
    margin: 0 4px 4px 4px;
  }

  @media (max-width: 899px) {
    border-right: none;
    flex-direction: column-reverse;
    text-align: left;

    h3,
    h4,
    h5,
    h6 {
      margin: 4px 0 0 0;
    }
  }
`

const Type = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  color: #979797;
`

const Unit = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 28px;
  margin-left: 4px;
  color: #333;
`

const TokenLogo = styled.img`
  vertical-align: middle;
  margin: 0 8px 0 0;
  width: 20px;
  height: 20px;
  position: relative;
  top: -2px;
`
