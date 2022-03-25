import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  title: string
  titleAddition?: React.ReactNode
  headerRight?: React.ReactNode
}

export const PageSection: React.FC<Props> = ({ title, titleAddition, headerRight, children }) => {
  return (
    <Stack as="section" px={3} pt={3} pb={4} borderTopWidth={1} borderTopStyle="solid" borderTopColor="borderSecondary">
      <Shelf justifyContent="space-between" as="header">
        <Shelf gap={1} alignItems="baseline">
          <Text variant="heading2" as="h1">
            {title}
          </Text>
          <Text variant="body1">{titleAddition}</Text>
        </Shelf>
        {headerRight}
      </Shelf>
      <Box px={3} pt={3}>
        {children}
      </Box>
    </Stack>
  )
}
