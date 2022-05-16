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
}

type TooltipsProps = {
  type: keyof typeof tooltipText
  variant?: 'uppercase' | 'lowercase'
}

export const Tooltips: React.VFC<TooltipsProps> = ({ type, variant = 'uppercase' }) => {
  const { label, title, body } = tooltipText[type]
  const isUppercase = variant === 'uppercase'
  return (
    <FabricTooltip title={title} body={body}>
      <Text variant={isUppercase ? 'body3' : 'label2'} style={isUppercase ? { textTransform: 'uppercase' } : {}}>
        {label}
      </Text>
    </FabricTooltip>
  )
}
