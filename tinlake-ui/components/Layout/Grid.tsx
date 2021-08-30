import * as CSS from 'csstype'
import React from 'react'
import { ResponsiveValue, TLengthStyledSystem } from 'styled-system'
import { PropsOf } from '../../helpers'
import { mapResponsive } from '../../utils/styled'
import { Box } from './Box'

interface OwnProps {
  gap?: ResponsiveValue<CSS.Property.GridColumnGap<TLengthStyledSystem>>
  rowGap?: ResponsiveValue<CSS.Property.GridRowGap<TLengthStyledSystem>>
  equalRows?: boolean
  equalColumns?: boolean
  columns?: ResponsiveValue<number>
  minColumnWidth?: ResponsiveValue<number>
}

type Props = OwnProps & PropsOf<typeof Box>

export const Grid: React.FC<Props> = ({
  gap,
  rowGap = gap,
  equalRows,
  equalColumns = false,
  minColumnWidth,
  columns = 2,
  ...rest
}) => {
  const templateColumns = minColumnWidth
    ? widthToColumns(minColumnWidth, equalColumns)
    : countToColumns(columns, equalColumns)

  return (
    <Box
      display="grid"
      gridColumnGap={gap}
      gridRowGap={rowGap}
      gridTemplateColumns={templateColumns}
      gridAutoRows={equalRows ? '1fr' : undefined}
      {...rest}
    />
  )
}

function toPx(n: number | string) {
  return typeof n === 'number' ? n + 'px' : n
}

function widthToColumns(width: ResponsiveValue<number>, equalColumns: boolean) {
  return mapResponsive(width, (value) => `repeat(auto-fit, minmax(${toPx(value)}, ${equalColumns ? '1fr' : 'auto'}))`)
}

function countToColumns(count: ResponsiveValue<number>, equalColumns: boolean) {
  return mapResponsive(count, (value) => `repeat(${value}, ${equalColumns ? '1fr' : 'auto'})`)
}
