import { Box, BoxProps, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
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
      <MainContainer gap={2}>{children}</MainContainer>
    </BasePadding>
  )
}

const MainContainer = styled(Stack)(
  css({
    maxWidth: 'mainContent',
  })
)
