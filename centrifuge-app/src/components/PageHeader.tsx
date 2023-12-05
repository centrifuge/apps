import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { ContextActions } from './ContextActions'
import { RouterTextLink } from './TextLink'

type Props = {
  title: React.ReactNode
  titleAddition?: React.ReactNode
  subtitle?: React.ReactNode
  subtitleLink?: {
    to: string
    label: string
  }
  pretitle?: string
  parent?: {
    to: string
    label: string
  }
  actions?: React.ReactNode
  icon?: React.ReactNode
  border?: boolean
  children?: React.ReactNode
}

export const PageHeader: React.FC<Props> = ({
  title,
  titleAddition,
  subtitle,
  subtitleLink,
  pretitle,
  icon,
  actions,
  border = true,
  parent,
  children,
}) => {
  const theme = useTheme()

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex="sticky"
      style={{
        boxShadow: border ? `0 1px 0 ${theme.colors.borderSecondary}` : undefined,
      }}
    >
      <Shelf px={[2, 3]} py="20px" justifyContent="space-between" alignItems="center" backgroundColor="backgroundPage">
        <Shelf gap={2}>
          {icon}
          <Stack gap={0}>
            {pretitle && (
              <Text variant="label2" color="textPrimary" style={{ textTransform: 'uppercase' }}>
                {pretitle}
              </Text>
            )}
            <Shelf gap={1}>
              <Text variant="heading1" as="h1" style={{ wordBreak: 'break-word' }}>
                {title}
              </Text>
              {titleAddition}
            </Shelf>
            {subtitle && (
              <Text variant="heading6">
                {subtitle}
                {subtitleLink && (
                  <>
                    {' '}
                    • <RouterTextLink to={subtitleLink.to}>{subtitleLink.label}</RouterTextLink>
                  </>
                )}
              </Text>
            )}
          </Stack>
        </Shelf>
        <ContextActions actions={actions} /*  parent={parent} TODO: breadcrumbs above page title */ />
      </Shelf>
      {children}
    </Box>
  )
}
