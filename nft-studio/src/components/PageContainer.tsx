import { Box, Container } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  variant?: 'default' | 'overlay'
  noPadding?: boolean
}

export const PageContainer: React.FC<Props> = ({ children, variant = 'default', noPadding }) => {
  return (
    <Box
      bg={variant === 'default' ? 'backgroundPage' : 'backgroundPrimary'}
      flex="1"
      display="flex"
      flexDirection="column"
      borderTop="1px solid currentcolor"
      color="borderPrimary"
    >
      <Container
        px={noPadding ? 0 : [1, 2, 3]}
        pt={noPadding ? 0 : [3, 5, 8]}
        flex="1"
        display="flex"
        flexDirection="column"
      >
        {children}
      </Container>
    </Box>
  )
}
