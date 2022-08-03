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
      pr={[3, 3, 7]}
      pt={3}
      pb={4}
      gap={3}
      borderTopWidth={1}
      borderTopStyle="solid"
      borderTopColor="borderSecondary"
    >
      {(title || titleAddition) && (
        <Shelf justifyContent="space-between" as="header">
          <Stack>
            <Shelf pl={!title ? [0, 0, 4] : undefined} gap={1} alignItems="baseline">
              {title && (
                <Text variant="heading2" as="h1">
                  {title}
                </Text>
              )}
              <Text variant="body2" color="textSecondary">
                {titleAddition}
              </Text>
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
      <Box pl={[0, 0, 4]}>{children}</Box>
    </Stack>
  )
}
