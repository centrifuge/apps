import * as React from 'react'
import { ResponsiveValue } from 'styled-system'
import { mapResponsive } from '../../utils/styled'
import { Box } from '../Box'
import { Grid } from '../Grid'

export const LayoutGrid: React.FC = ({ children }) => {
  return (
    <Grid columns={[4, 4, 8, 12]} equalColumns gap={['gutterMobile', 'gutterTablet', 'gutterDesktop']}>
      {children}
    </Grid>
  )
}

type ItemProps = {
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
