import * as React from 'react'
import { ResponsiveValue } from 'styled-system'
import { mapResponsive } from '../../utils/styled'
import { Box, BoxProps } from '../Box'
import { Grid, GridProps } from '../Grid'

export type LayoutGridProps = Omit<GridProps, 'columns' | 'equalColumns' | 'gap'>

export const LayoutGrid: React.FC<LayoutGridProps> = ({ children, ...rest }) => {
  return (
    <Grid columns={[4, 4, 8, 12]} equalColumns gap={['gutterMobile', 'gutterTablet', 'gutterDesktop']} {...rest}>
      {children}
    </Grid>
  )
}

type ItemProps = BoxProps & {
  span?: ResponsiveValue<number>
  push?: ResponsiveValue<number>
}

export const LayoutGridItem: React.FC<ItemProps> = ({ span, push, children, ...rest }) => {
  return (
    <>
      {push && (
        <Box
          gridColumn={mapResponsive(push, (value) => (value === 0 ? '' : `auto / span ${value}`))}
          display={mapResponsive(push, (value) => (value === 0 ? 'none' : 'initial'))}
        />
      )}
      <Box gridColumn={mapResponsive(span, (value) => `auto / span ${value}`)} {...rest}>
        {children}
      </Box>
    </>
  )
}
