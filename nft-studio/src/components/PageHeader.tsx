import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import logoUrl from '../assets/images/altair-wordmark-light.svg'
import { ContextActions } from './ContextActions'
import { useDebugFlags } from './DebugFlags'
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
  return (
    <Shelf as="header" justifyContent="space-between" alignItems="flex-start" position="sticky" top="24px">
      <Box position="absolute" top="-24px" bottom={0} right="-12px" left="-12px" zIndex={-1} />
      {!showOnlyNFT && (
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
      )}

      {showOnlyNFT && (
        <>
          <Box height="48px" width="60px" marginTop="-8px">
            <img src={logoUrl} alt="" />
          </Box>
          <Box position="absolute" width="100%" textAlign="center" display={['none', 'block']}>
            <Text variant="heading2">NFT Playground</Text>
          </Box>
        </>
      )}

      <ContextActions actions={actions} walletShown={walletShown} />
    </Shelf>
  )
}
