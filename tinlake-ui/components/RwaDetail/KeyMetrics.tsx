import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import * as React from 'react'
import styled from 'styled-components'
import { Grid, Shelf } from '../Layout'
import { formatNumber } from './format'
import { useRwaContext } from './RwaContextProvider'

const USDC_DECIMALS = 6

export const KeyMetrics: React.FC = () => {
  const { marketSize, totalBorrowed } = useRwaContext()

  const marketSizeFormatted = addThousandsSeparators(toPrecision(baseToDisplay(marketSize || '0', USDC_DECIMALS), 0))
  // const totalBorrowedFormatted = addThousandsSeparators(toPrecision(baseToDisplay(totalBorrowed || '0', USDC_DECIMALS), 0))

  const totalBorrowedFormatted = formatNumber(totalBorrowed)

  return (
    <Grid columns={3} equalColumns>
      <Metric value={marketSizeFormatted} unit="USDC" label="Market size" iconUrl="/static/rwa/USDC.svg" />
      <Metric value={totalBorrowedFormatted} unit="USDC" label="Total borrowed" iconUrl="/static/rwa/USDC.svg" />
      <Metric value="Target: 3.5" unit="%" label="Deposit APY" />
      {/* <Metric value="xx.xx" unit="%" label="wCFG reward APY" iconUrl="/static/cfg-black-transparent.svg" /> */}
    </Grid>
  )
}

type MetricProps = {
  value?: string
  unit: string
  label: string
  iconUrl?: string
}

const Metric: React.FC<MetricProps> = ({ value, unit, label, iconUrl }) => (
  <Section>
    <Shelf gap="4px" alignItems="center">
      {iconUrl && <SmallIcon src={iconUrl} />}
      <Shelf gap="4px" alignItems="baseline">
        <MetricValue>{value}</MetricValue>
        <MetricUnit>{unit}</MetricUnit>
      </Shelf>
    </Shelf>
    <MetricLabel>{label}</MetricLabel>
  </Section>
)

const SmallIcon = styled.img`
  width: 16px;
  height: 16px;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  height: 80px;
  align-items: center;
  justify-content: center;
  :not(:first-child) {
    border-left: 1px solid #d8d8d8;
  }
`

const MetricValue = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 28px;
`

const MetricUnit = styled.span`
  font-weight: 500;
  font-size: 10px;
  line-height: 14px;
`

const MetricLabel = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 137.5%;
  color: #777;
`
