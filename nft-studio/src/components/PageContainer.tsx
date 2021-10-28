import { Box, Container } from '@centrifuge/fabric'
import * as React from 'react'

export const PageContainer: React.FC = ({ children }) => {
  return (
    <Box px={[1, 2, 3]} bg="backgroundPage">
      <Container pt={1}>{children}</Container>
    </Box>
  )
}
