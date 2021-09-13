import * as React from 'react'
import styled from 'styled-components'
import { typography, TypographyProps } from 'styled-system'
import { Shelf } from '../Layout'
import { LoadingValue } from '../LoadingValue'

export type Variant = 'default' | 'large' | 'sectionHeading' | 'primaryList' | 'secondaryList' | 'tertiaryList'

export interface Props {
  variant?: Variant
  /**
   * Shows loading box when value == null
   */
  value: React.ReactChild | null
  icon?: React.ReactNode
  unit?: React.ReactNode
}

export const ValueVariantContext = React.createContext<Variant>('default')
export const useValueVariantContext = () => React.useContext(ValueVariantContext)

export const Value: React.FC<Props> = ({ variant: variantProp, value, icon, unit }) => {
  const variantCtx = useValueVariantContext()
  const variant = variantProp || variantCtx

  let valueFontSize
  let valueFontWeight
  let unitFontSize
  let unitFontWeight
  let gap = '4px'
  let iconSize = 16
  switch (variant) {
    case 'primaryList':
      valueFontSize = 16
      valueFontWeight = 600
      unitFontSize = 10
      unitFontWeight = 500
      break
    case 'secondaryList':
    case 'tertiaryList':
      valueFontSize = 14
      valueFontWeight = 400
      unitFontSize = 14
      unitFontWeight = 400
      break
    case 'sectionHeading':
      valueFontSize = 16
      valueFontWeight = 600
      unitFontSize = 16
      unitFontWeight = 600
      break
    case 'large':
      valueFontSize = 24
      valueFontWeight = 500
      unitFontSize = 16
      unitFontWeight = 500
      iconSize = 24
      gap = 'xsmall'
      break
    default:
      valueFontSize = 16
      valueFontWeight = 500
      unitFontSize = 10
      unitFontWeight = 400
  }

  return (
    <Shelf gap={gap}>
      {typeof icon === 'string' ? <Icon size={iconSize} src={icon} /> : icon}
      <Shelf gap={gap} alignItems="baseline">
        <LoadingValue done={value != null} width={75} height={valueFontSize}>
          <Text fontSize={valueFontSize} fontWeight={valueFontWeight} lineHeight={1}>
            {typeof value === 'number'
              ? value.toLocaleString('en-us', { maximumFractionDigits: value < 1000 ? 2 : 0 })
              : value}
          </Text>
          {unit && (
            <Text fontSize={unitFontSize} fontWeight={unitFontWeight} lineHeight={1.2}>
              {unit}
            </Text>
          )}
        </LoadingValue>
      </Shelf>
    </Shelf>
  )
}

const Icon = styled.img<{ size: number }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
`

const Text = styled.span<TypographyProps>({ color: 'black' }, typography)
