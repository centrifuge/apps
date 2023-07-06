import { Box, IconCheckInCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type SuccessBannerProps = {
  title: string
  body?: string
  children?: React.ReactNode
}

export function SuccessBanner({ title, body, children }: SuccessBannerProps) {
  return (
    <Box>
      <Stack p={2} gap={1} backgroundColor="secondarySelectedBackground" borderRadius="card">
        <Shelf gap={1}>
          <IconCheckInCircle size="iconSmall" />
          <Text variant="body2" fontWeight={600}>
            {title}
          </Text>
        </Shelf>
        {body && <Text variant="body3">{body}</Text>}
      </Stack>
      {children}
    </Box>
  )
}
