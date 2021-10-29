import { Box, Container } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'

type Props = {
  variant?: 'default' | 'overlay'
  noPadding?: boolean
}

export const PageContainer: React.FC<Props> = ({ children, variant = 'default', noPadding }) => {
  const {
    sizes: { navBarHeight, navBarHeightMobile },
  } = useTheme()
  const mobileHeight = `calc(100vh - ${navBarHeightMobile}px - 1px)`
  const desktopHeight = `calc(100vh - ${navBarHeight}px - 1px)`

  return (
    <Box
      bg={variant === 'default' ? 'backgroundPage' : 'backgroundPrimary'}
      borderTop="1px solid currentcolor"
      color="borderPrimary"
    >
      <Container
        px={noPadding ? 0 : [1, 2, 3]}
        pt={noPadding ? 0 : [3, 5, 8]}
        minHeight={[mobileHeight, mobileHeight, desktopHeight]}
        display="flex"
        flexDirection="column"
      >
        {children}
      </Container>
    </Box>
  )
}
