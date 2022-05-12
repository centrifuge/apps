import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  title?: string
  titleAddition?: React.ReactNode
  subtitle?: string
  headerRight?: React.ReactNode
}

export const PageSection: React.FC<Props> = ({ title, titleAddition, subtitle, headerRight, children }) => {
  return (
    <Stack
      as="section"
      pl={3}
      pr={7}
      pt={3}
      pb={4}
      gap={3}
      borderTopWidth={1}
      borderTopStyle="solid"
      borderTopColor="borderSecondary"
    >
      {title && (
        <Shelf justifyContent="space-between" as="header">
          <Stack>
            <Shelf gap={1} alignItems="baseline">
              <Text variant="heading2" as="h1">
                {title}
              </Text>
              <Text variant="body1">{titleAddition}</Text>
            </Shelf>

            {subtitle && (
              <Text variant="body2" color="textSecondary">
                {subtitle}
              </Text>
            )}
          </Stack>
          {headerRight}
        </Shelf>
      )}
      <Box pl={4}>{children}</Box>
    </Stack>
  )
}
