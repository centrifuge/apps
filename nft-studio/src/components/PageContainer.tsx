import { Box, Container } from '@centrifuge/fabric'
import * as React from 'react'

export const PageContainer: React.FC = ({ children }) => {
  return (
    <Box px={[2, 3]} bg="backgroundPage">
      <Container pt={5}>{children}</Container>
    </Box>
  )
}
