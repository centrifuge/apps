import * as React from 'react'
import { ClientOnlyRender } from '../ClientOnlyRender'
import { Box, Center } from '../Layout'

interface Props {
  width?: string | number
  noMargin?: boolean
}

export const PageContainer: React.FC<Props> = ({ width = 'page', children, noMargin }) => {
  return (
    <Center px={['12px', '24px']} maxWidth="100%" background="rgb(249, 249, 249)">
      <ClientOnlyRender>
        <Box pt={!noMargin ? 'xlarge' : undefined} width={width} maxWidth="100%">
          {children}
        </Box>
      </ClientOnlyRender>
    </Center>
  )
}
