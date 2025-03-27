import Identicon from '@polkadot/react-identicon'
import { IconTheme } from '@polkadot/react-identicon/types'
import * as React from 'react'
import styled from 'styled-components'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Text } from '../Text'
import { VisualButton, VisualButtonProps } from './VisualButton'

export type WalletButtonProps = Omit<
  VisualButtonProps & React.ComponentPropsWithoutRef<'button'>,
  'variant' | 'iconRight' | 'type' | 'children' | 'icon'
> & {
  alias?: string
  connectLabel?: string
  address?: string
  displayAddress?: string
  balance?: string
  icon?: IconTheme | React.ReactElement
}

const StyledButton = styled.button`
  display: inline-block;
  padding: 0;
  border: none;
  appearance: none;
  background-color: ${({ theme }) => theme.colors.backgroundPrimary};
  outline: 0;
  border-radius: 4px;
  white-space: nowrap;
  border: 3px solid transparent;
  width: 220px;
`

const IdenticonWrapper = styled(Flex)({
  borderRadius: '50%',
  overflow: 'hidden',
  pointerEvents: 'none',
})

export function WalletButton({
  alias,
  icon = 'polkadot',
  small = true,
  disabled,
  loading,
  loadingMessage = 'Connecting...',
  active,
  connectLabel = 'Connect wallet',
  address,
  displayAddress = address,
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
        {alias && address ? (
          <Box position="relative" flex="1 1 auto">
            <Shelf position="absolute" top="0" bottom="0" left="0" width="100%" m="auto" height="30px">
              <Text
                fontSize={small ? 14 : 16}
                color="textInverted"
                fontWeight={500}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {alias}
              </Text>
            </Shelf>
          </Box>
        ) : (
          <Text
            fontSize={small ? 14 : 16}
            color="textInverted"
            fontWeight={500}
            style={{ margin: address ? 0 : 'auto' }}
          >
            {displayAddress ? truncate(displayAddress) : connectLabel}
          </Text>
        )}
        {address && balance && (
          <Text variant="body3" color="textInverted" style={{ marginLeft: 'auto' }}>
            {balance}
          </Text>
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
