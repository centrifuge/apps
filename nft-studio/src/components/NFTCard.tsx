import { Box, Card, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'

type Props = {}

export const NFTCard: React.FC<Props> = () => {
  return (
    <Card as={Link} to="/collection/1/object/2" variant="interactive" pb={[3, 4]}>
      <Stack gap={[2, 3]}>
        <Box bg="#eee" style={{ aspectRatio: '1' }} />
        <Box px={[2, 3]}>
          <Text as="h2" variant="heading2">
            NFT Name
          </Text>
          <Text variant="label1">By Some Person</Text>
        </Box>
      </Stack>
    </Card>
  )
}
