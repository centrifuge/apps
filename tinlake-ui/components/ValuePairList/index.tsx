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
      <Stack gap={gap} as="dl" margin={0}>
        {items.map((item, i) => (
          <>
            <Shelf justifyContent="space-between">
              <Wrap alignItems="baseline" gap="xsmall">
                <Term fontWeight={termFontWeight}>{item.term}</Term>
                {item.termSuffix && <TermSuffix>{item.termSuffix}</TermSuffix>}
              </Wrap>
              <dd>
                <Value value={item.value} icon={item.valueIcon} unit={item.valueUnit} />
              </dd>
            </Shelf>
            {variant === 'secondary' && i < items.length - 1 && <Divider />}
          </>
        ))}
      </Stack>
    </ValueVariantContext.Provider>
  )
}

const Term = styled.dt<{ fontWeight: number }>`
  font-weight: ${(props) => props.fontWeight};
  color: black;
`

const TermSuffix = styled.span`
  font-size: 10px;
  color: black;
`
