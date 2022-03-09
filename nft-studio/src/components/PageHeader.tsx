import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ContextActions } from './ContextActions'
import { RouterTextLink } from './TextLink'

type Props = {
  title: string
  titleAddition?: React.ReactNode
  subtitle?: React.ReactNode
  subtitleLink?: {
    to: string
    label: string
  }
  parent?: {
    to: string
    label: string
  }
  actions?: React.ReactNode
  walletShown?: boolean
}

const BackLink = styled(Link)(
  css({
    position: 'relative',
    color: 'brand',
    '&:visited': {
      color: 'brand',
    },
  })
)

export const PageHeader: React.FC<Props> = ({
  title,
  titleAddition,
  subtitle,
  subtitleLink,
  parent,
  actions,
  walletShown = true,
}) => {
  return (
    <Shelf as="header" justifyContent="space-between" alignItems="flex-start" position="sticky" top="24px">
      <Box
        position="absolute"
        top="-24px"
        bottom={0}
        right="-12px"
        left="-12px"
        backgroundColor="backgroundPrimary"
        zIndex={-1}
      />
      <Stack gap={1}>
        <Shelf minHeight={20}>
          {parent && (
            <Text variant="interactive1">
              <BackLink to={parent.to}>{parent.label}</BackLink>
            </Text>
          )}
        </Shelf>
        <Shelf gap={1}>
          <Text variant="heading2" as="h1" style={{ wordBreak: 'break-word' }}>
            {title}
          </Text>
          {titleAddition}
        </Shelf>
        {subtitle && (
          <Text variant="heading6" fontWeight={500}>
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
      <ContextActions actions={actions} walletShown={walletShown} />
    </Shelf>
  )
}
