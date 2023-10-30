import { Box, BoxProps, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { BasePadding } from './BasePadding'

type Props = {
  title?: React.ReactNode
  titleAddition?: React.ReactNode
  subtitle?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
} & BoxProps

export function LayoutSection({ title, titleAddition, subtitle, headerRight, children, ...boxProps }: Props) {
  return (
    <BasePadding as="section" gap={2} {...boxProps}>
      {(title || titleAddition || subtitle || headerRight) && (
        <Shelf justifyContent="space-between" as="header">
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
      {children}
    </BasePadding>
  )
}
