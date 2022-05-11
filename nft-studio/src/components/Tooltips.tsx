import { Text, Tooltip as FabricTooltip } from '@centrifuge/fabric'
import * as React from 'react'

const tooltipText = {
  assetClass: {
    label: 'Asset Class',
    title: 'What is an asset class?',
    body: 'This is what an asset class is',
  },
  apy: {
    label: 'APY',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  protection: {
    label: 'Protection',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  valueLocked: {
    label: 'Value locked',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  tvl: {
    label: 'Total value locked (tvl)',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  tokens: {
    label: 'Tokens',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  age: {
    label: 'Age',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  averageAssetMaturity: {
    label: 'Average asset maturity',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  poolValue: {
    label: 'Pool value',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  reserve: {
    label: 'Reserve',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  assetValue: {
    label: 'Asset value',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  ongoingAssets: {
    label: 'Ongoing assets',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  averageFinancingFee: {
    label: 'Average financing fee',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  averageAmount: {
    label: 'Average amount',
    title: 'placeholder title',
    body: 'placeholder body',
  },
}

type TooltipsProps = {
  type: keyof typeof tooltipText
  variant?: 'primary' | 'secondary'
}

export const Tooltips: React.VFC<TooltipsProps> = ({ type, variant = 'primary' }) => {
  const { label, title, body } = tooltipText[type]
  const isPrimary = variant === 'primary'
  return (
    <FabricTooltip title={title} body={body}>
      <Text textAlign="left" variant="label2" color={isPrimary ? 'textPrimary' : 'textSecondary'}>
        {label}
      </Text>
    </FabricTooltip>
  )
}
