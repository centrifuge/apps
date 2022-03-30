import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { ContextActions } from './ContextActions'
import { RouterTextLink } from './TextLink'

type Props = {
  title: string
  titleAddition?: React.ReactNode
  subtitle?: React.ReactNode
  subtitleFirst?: boolean
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
  walletShown?: boolean
}

export const PageHeader: React.FC<Props> = ({
  title,
  titleAddition,
  subtitle,
  pretitle,
  subtitleLink,
  icon,
  actions,
  walletShown,
}) => {
  const theme = useTheme()

  return (
    <Shelf
      as="header"
      justifyContent="space-between"
      alignItems="flex-start"
      position="sticky"
      top={0}
      backgroundColor="backgroundPage"
      style={{
        boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
      }}
      zIndex={4}
      p={3}
    >
      {/* <Box
        position="absolute"
        top="-24px"
        bottom={0}
        right="-12px"
        left="-12px"
        zIndex={-1}
        backgroundColor="backgroundPage"
      /> */}

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

      <ContextActions actions={actions} walletShown={walletShown} />
    </Shelf>
  )
}
