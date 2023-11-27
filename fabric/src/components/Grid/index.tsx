import * as CSS from 'csstype'
import * as React from 'react'
import styled from 'styled-components'
import { ResponsiveValue, TLengthStyledSystem } from 'styled-system'
import { mapResponsive, toPx } from '../../utils/styled'
import { Box, BoxProps } from '../Box'

type OwnProps = {
  gap?: ResponsiveValue<CSS.Property.GridColumnGap<TLengthStyledSystem>>
  rowGap?: ResponsiveValue<CSS.Property.GridRowGap<TLengthStyledSystem>>
  equalRows?: boolean
  equalColumns?: boolean
  columns?: ResponsiveValue<number>
  minColumnWidth?: ResponsiveValue<TLengthStyledSystem>
}

export type GridProps = OwnProps & BoxProps

const StyledGrid = styled(Box)`
  & > * {
    min-width: 0;
  }
`

export const Grid = React.forwardRef<any, GridProps>(
  ({ gap, rowGap = gap, equalRows, equalColumns = false, minColumnWidth, columns = 2, ...rest }, ref) => {
    const templateColumns = minColumnWidth
      ? widthToColumns(minColumnWidth, equalColumns)
      : countToColumns(columns, equalColumns)

    return (
      <StyledGrid
        display="grid"
        gridColumnGap={gap}
        gridRowGap={rowGap}
        gridTemplateColumns={templateColumns}
        gridAutoRows={equalRows ? '1fr' : undefined}
        {...rest}
        ref={ref}
      />
    )
  }
)
function widthToColumns(width: ResponsiveValue<TLengthStyledSystem>, equalColumns: boolean) {
  return mapResponsive(width, (value) => `repeat(auto-fit, minmax(${toPx(value)}, ${equalColumns ? '1fr' : 'auto'}))`)
}

function countToColumns(count: ResponsiveValue<number>, equalColumns: boolean) {
  return mapResponsive(count, (value) => `repeat(${value}, ${equalColumns ? '1fr' : 'auto'})`)
}
