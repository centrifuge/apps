import * as React from 'react'
import { ResponsiveValue } from 'styled-system'
import { Box, Grid } from '.'
import { mapResponsive } from '../../utils/styled'

interface Props {}

export const LayoutGrid: React.FC<Props> = ({ children }) => {
  return (
    <Grid columns={[4, 8, 12]} gap={[16, 16, 24]}>
      {children}
    </Grid>
  )
}

interface ItemProps {
  span?: ResponsiveValue<number>
  push?: ResponsiveValue<number>
}

export const LayoutGridItem: React.FC<ItemProps> = ({ span, push, children }) => {
  return (
    <>
      {push && (
        <Box
          gridColumn={mapResponsive(push, (value) => (value === 0 ? '' : `auto / span ${value}`))}
          display={mapResponsive(push, (value) => (value === 0 ? 'none' : 'initial'))}
        />
      )}
      <Box gridColumn={mapResponsive(span, (value) => `auto / span ${value}`)}>{children}</Box>
    </>
  )
}
