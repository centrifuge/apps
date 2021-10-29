import { Box, Container } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  variant?: 'default' | 'overlay'
}

export const PageContainer: React.FC<Props> = ({ children, variant = 'default' }) => {
  return (
    <Box bg={variant === 'default' ? 'backgroundPage' : 'backgroundPrimary'}>
      <Container px={[1, 2, 3]} pt={variant === 'default' ? [3, 5, 8] : 0}>
        {children}
      </Container>
    </Box>
  )
}
