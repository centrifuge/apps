import { Box, BoxProps, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  title?: React.ReactNode
  titleAddition?: React.ReactNode
  subtitle?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
} & BoxProps

export function LayoutSection({ title, titleAddition, subtitle, headerRight, children, gap = 2, ...boxProps }: Props) {
  return (
    <Stack as="section" gap={3} pt={20} pb={20} {...boxProps}>
      {(title || titleAddition || subtitle || headerRight) && (
        <Shelf justifyContent="space-between" as="header" maxWidth="mainContent">
          <Stack>
            {(title || titleAddition) && (
              <Shelf gap={1} alignItems="baseline">
                {title && (
                  <Text as="h2" variant="heading2">
                    {title}
                  </Text>
                )}
                <Text variant="body2" color="textSecondary">
                  {titleAddition}
                </Text>
              </Shelf>
            )}
            {subtitle && (
              <Text variant="body2" as="small" color="textSecondary">
                {subtitle}
              </Text>
            )}
          </Stack>
          <Box ml="auto">{headerRight}</Box>
        </Shelf>
      )}
      <Stack gap={gap} maxWidth="mainContent">
        {children}
      </Stack>
    </Stack>
  )
}
