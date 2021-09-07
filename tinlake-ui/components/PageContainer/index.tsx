import * as React from 'react'
import { Box, Center } from '../Layout'

export const PageContainer: React.FC = ({ children }) => {
  return (
    <Center px={['12px', '24px']} maxWidth="100%" background="rgb(249, 249, 249)">
      <Box pt="xlarge" width="container" maxWidth="100%">
        {children}
      </Box>
    </Center>
  )
}
