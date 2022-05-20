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
  connectLabel?: string
  address?: string
  alias?: string
  balance?: string
  iconStyle?: IconTheme
}

const StyledButton = styled.button({
  display: 'inline-block',
  width: '100%',
  padding: '0',
  border: 'none',
  appearance: 'none',
  background: 'transparent',
  outline: '0',
  whiteSpace: 'nowrap',
})

const IdenticonWrapper = styled(Flex)({
  pointerEvents: 'none',
})

export const WalletButton: React.VFC<WalletButtonProps> = ({
  iconStyle = 'polkadot',
  small = true,
  disabled,
  loading,
  loadingMessage = 'Connecting...',
  active,
  connectLabel = 'Connect wallet',
  address,
  alias,
  balance,
  ...buttonProps
}) => {
  return (
    <StyledButton type="button" disabled={loading || disabled} {...buttonProps}>
      <VisualButton
        variant="wallet"
        small={small}
        icon={
          address ? (
            <IdenticonWrapper>
              <Identicon value={address} size={24} theme={iconStyle} />
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
              <Text
                fontSize={small ? 14 : 16}
                color="inherit"
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
          <Text fontSize={small ? 14 : 16} color="inherit" fontWeight={500} style={{ margin: address ? 0 : 'auto' }}>
            {address ? truncate(address) : connectLabel}
          </Text>
        )}
        {address && balance && (
          <Text variant="body3" color="inherit" style={{ marginLeft: 'auto' }}>
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
