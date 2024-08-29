import Identicon from '@polkadot/react-identicon'
import { IconTheme } from '@polkadot/react-identicon/types'
import * as React from 'react'
import styled from 'styled-components'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Text } from '../Text'
import { VisualButton, VisualButtonProps } from './VisualButton'

const StyledInteractiveText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
`

const StyledText = styled(Text)`
  marginleft: auto;
`

const StyledBodyText = styled(Text)<{ margin?: string | number }>`
  margin-left: auto;
  ${({ margin }) => margin && `margin: ${margin};`}
`

export type WalletButtonProps = Omit<
  VisualButtonProps & React.ComponentPropsWithoutRef<'button'>,
  'variant' | 'iconRight' | 'type' | 'children' | 'icon'
> & {
  connectLabel?: string
  address?: string
  displayAddress?: string
  alias?: string
  balance?: string
  icon?: IconTheme | React.ReactElement
}

const StyledButton = styled.button`
  display: inline-block;
  width: 100%;
  padding: 0;
  border: none;
  appearance: none;
  background-color: ${({ theme }) => theme.colors.backgroundPrimary};
  outline: 0;
  border-radius: 40px;
  white-space: nowrap;
`

const IdenticonWrapper = styled(Flex)({
  borderRadius: '50%',
  overflow: 'hidden',
  pointerEvents: 'none',
})

export function WalletButton({
  icon = 'polkadot',
  small = true,
  disabled,
  loading,
  loadingMessage = 'Connecting...',
  active,
  connectLabel = 'Connect wallet',
  address,
  displayAddress = address,
  alias,
  balance,
  ...buttonProps
}: WalletButtonProps) {
  return (
    <StyledButton type="button" disabled={loading || disabled} {...buttonProps}>
      <VisualButton
        variant="wallet"
        small={small}
        icon={
          address ? (
            <IdenticonWrapper>
              {typeof icon === 'string' ? <Identicon value={address} size={24} theme={icon} /> : icon}
            </IdenticonWrapper>
          ) : undefined
        }
        disabled={disabled}
        loading={loading}
        loadingMessage={loadingMessage}
        active={active}
      >
        {address && alias ? (
          <Box position="relative" flex="1 1 auto">
            <Shelf position="absolute" top="0" bottom="0" left="0" width="100%" m="auto" height="30px">
              <StyledInteractiveText fontSize={small ? 14 : 16} color="textInteractive" fontWeight={500}>
                {alias}
              </StyledInteractiveText>
            </Shelf>
          </Box>
        ) : (
          <StyledBodyText
            margin={address ? 0 : 'auto'}
            fontSize={small ? 14 : 16}
            color="textInteractive"
            fontWeight={500}
          >
            {displayAddress ? truncate(displayAddress) : connectLabel}
          </StyledBodyText>
        )}
        {address && balance && (
          <StyledText variant="body3" color="textInteractive">
            {balance}
          </StyledText>
        )}
      </VisualButton>
    </StyledButton>
  )
}

export function truncate(string: string) {
  const first = string.slice(0, 5)
  const last = string.slice(-5)

  return `${first}...${last}`
}
