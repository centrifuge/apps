import * as CSS from 'csstype'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { ResponsiveValue, TLengthStyledSystem } from 'styled-system'
import { mapResponsive, toPx } from '../../utils/styled'
import { Box, BoxProps } from '../Box'

type OwnProps = {
  gap?: ResponsiveValue<CSS.Property.GridColumnGap<TLengthStyledSystem>>
  rowGap?: ResponsiveValue<CSS.Property.GridRowGap<TLengthStyledSystem>>
  equalRows?: boolean
  equalColumns?: boolean
  columns?: ResponsiveValue<number>
  maxColumns?: number
  minColumnWidth?: ResponsiveValue<TLengthStyledSystem>
}

export type GridProps = OwnProps & BoxProps

const StyledGrid = styled(Box)`
  & > * {
    min-width: 0;
  }
`

export const Grid = React.forwardRef<any, GridProps>(
  ({ gap, rowGap = gap, equalRows, equalColumns = false, minColumnWidth, maxColumns, columns = 1, ...rest }, ref) => {
    const templateColumns = minColumnWidth
      ? maxColumns
        ? widthToMaxColumns(minColumnWidth, maxColumns, equalColumns)
        : widthToColumns(minColumnWidth, equalColumns)
      : countToColumns(columns, equalColumns)
    const theme = useTheme()
    const biggestGap = (Array.isArray(gap) ? gap.at(-1) : gap || 0) as number | string
    const gapPx = toPx(theme.space[biggestGap as any] || biggestGap || 0)

    return (
      <StyledGrid
        display="grid"
        gridColumnGap={gap}
        gridRowGap={rowGap}
        gridTemplateColumns={templateColumns}
        gridAutoRows={equalRows ? '1fr' : undefined}
        {...rest}
        // @ts-ignore
        style={{ '--grid-gap': gapPx }}
        ref={ref}
      />
    )
  }
)

export const GridRow = styled(Box)`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: start / end;
`

function widthToMaxColumns(width: ResponsiveValue<TLengthStyledSystem>, maxColumns: number, equalColumns: boolean) {
  return mapResponsive(
    width,
    (value) =>
      `[start] repeat(auto-fill, minmax(max(${toPx(
        value
      )}, calc((100% - ((${maxColumns} - 1) * var(--grid-gap))) / ${maxColumns})), ${
        equalColumns ? '1fr' : 'auto'
      })) [end]`
  )
}

function widthToColumns(width: ResponsiveValue<TLengthStyledSystem>, equalColumns: boolean) {
  return mapResponsive(
    width,
    (value) => `[start] repeat(auto-fit, minmax(${toPx(value)}, ${equalColumns ? '1fr' : 'auto'})) [end]`
  )
}

function countToColumns(count: ResponsiveValue<number>, equalColumns: boolean) {
  return mapResponsive(count, (value) => `[start] repeat(${value}, ${equalColumns ? '1fr' : 'auto'}) [end]`)
}
