import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import { Link, NavLink } from 'react-router-dom'
import styled from 'styled-components'
import logoUrl from '../assets/images/altair-wordmark-light.svg'
import { ContextActions } from './ContextActions'
import { useDebugFlags } from './DebugFlags'
import { PAGE_PX } from './shared/PageWithSideBar'
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
    color: 'accentPrimary',
    '&:visited': {
      color: 'accentPrimary',
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
  const showOnlyNFT = useDebugFlags().showOnlyNFT

  if (showOnlyNFT) {
    return (
      <Shelf
        as="header"
        position="sticky"
        top="0"
        height="80px"
        alignItems="center"
        backgroundColor="backgroundPage"
        bleedX={PAGE_PX}
        px={PAGE_PX}
        borderBottomColor="borderPrimary"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
      >
        <Box flex="1">
          <NavLink to="/">
            <img src={logoUrl} alt="" height="48px" width="60px" />
          </NavLink>
        </Box>
        <Box>
          <Text variant="heading2">NFT Playground</Text>
        </Box>
        <Shelf flex="1" justifyContent="flex-end">
          <ContextActions actions={actions} walletShown={walletShown} />
        </Shelf>
      </Shelf>
    )
  }
  return (
    <Shelf as="header" justifyContent="space-between" alignItems="flex-start" position="sticky" top="24px">
      <Box
        position="absolute"
        top="-24px"
        bottom={0}
        right="-12px"
        left="-12px"
        zIndex={-1}
        backgroundColor="backgroundPage"
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
