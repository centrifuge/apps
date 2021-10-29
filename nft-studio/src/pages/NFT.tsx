import { Box, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { SplitView } from '../components/SplitView'

export const NFTPage: React.FC = () => {
  return (
    <SplitView
      left={
        <Box display="flex" alignItems="center" justifyContent="center" py={[1, 5, 8]} height="100%">
          <Box
            as="img"
            maxHeight="80vh"
            src="http://cloudflare-ipfs.com/ipfs/QmTH4KuiCGWr1WzGZyzgZXjugnsWdN57zq8kURpzUZz9k5"
          />
        </Box>
      }
      right={
        <Stack pt={8}>
          <Text>Collection</Text>
        </Stack>
      }
    />
  )
}
