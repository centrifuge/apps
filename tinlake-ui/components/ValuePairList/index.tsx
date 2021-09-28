import * as React from 'react'
import styled from 'styled-components'
import { Divider } from '../Divider'
import { Shelf, Stack, Wrap } from '../Layout'
import { Props as ValueProps, Value, ValueVariantContext, Variant as ValueVariant } from '../Value'

type Variant = 'primary' | 'secondary' | 'tertiary'

interface Item {
  term: React.ReactNode
  termSuffix?: React.ReactNode
  value: ValueProps['value']
  valueIcon?: ValueProps['icon']
  valueUnit?: ValueProps['unit']
  valueSuffix?: React.ReactNode
}

interface Props {
  variant?: Variant
  items: Item[]
}

export const ValuePairList: React.FC<Props> = ({ variant = 'primary', items }) => {
  let gap = '4px'
  let termFontWeight = 400

  if (variant === 'primary') {
    gap = '12px'
    termFontWeight = 500
  } else if (variant === 'secondary') {
    gap = '12px'
  }

  const variantMap: { [key: string]: ValueVariant } = {
    primary: 'primaryList',
    secondary: 'secondaryList',
    tertiary: 'tertiaryList',
  }

  return (
    <ValueVariantContext.Provider value={variantMap[variant]}>
      <Stack as="dl" gap={gap} margin={0}>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <Shelf justifyContent="space-between" alignItems="baseline">
              <Wrap as="dt" alignItems="baseline" gap="xsmall" rowGap={0}>
                <Term fontWeight={termFontWeight}>{item.term}</Term>
                {item.termSuffix && <TermSuffix>{item.termSuffix}</TermSuffix>}
              </Wrap>
              <Stack as="dd" alignItems="flex-end">
                <Value value={item.value} icon={item.valueIcon} unit={item.valueUnit} />
                {item.valueSuffix && <Value value={item.valueSuffix} />}
              </Stack>
            </Shelf>
            {variant === 'secondary' && i < items.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Stack>
    </ValueVariantContext.Provider>
  )
}

const Term = styled.span<{ fontWeight: number }>`
  font-weight: ${(props) => props.fontWeight};
  color: black;
`

const TermSuffix = styled.span`
  font-size: 10px;
  color: black;
`
