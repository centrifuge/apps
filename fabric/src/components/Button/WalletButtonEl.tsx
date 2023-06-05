import Identicon from '@polkadot/react-identicon'
import { IconTheme } from '@polkadot/react-identicon/types'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { Text } from '../Text'
import { MiddleEllipsis } from '../MiddleEllipsis'
import { VisualButton, VisualButtonProps } from './VisualButton'

export type ButtonProps = Omit<
  VisualButtonProps & React.ComponentPropsWithoutRef<'button'>,
  'variant' | 'iconRight' | 'type' | 'children'
> & {
  connectLabel?: string
  address?: string
  alias?: string
  balance?: string
  iconStyle?: IconTheme
}

const StyledButton = styled.button(
  css({
    display: 'inline-block',
    width: '100%',
    padding: '0',
    border: 'none',
    appearance: 'none',
    background: 'transparent',
    outline: '0',
    whiteSpace: 'nowrap',
  })
)

const IdenticonWrapper = styled(Flex)({
  pointerEvents: 'none',
})

export const WalletButtonEl: React.VFC<ButtonProps> = ({
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
  const fontSize = small ? 14 : 16

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
        {address ? (
          <Box position="relative" flex="1 1 auto" minHeight="24px">
            <Flex
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              alignItems="center"
              style={{ whiteSpace: 'nowrap' }}
            >
              {alias ? (
                <Text
                  fontSize={fontSize}
                  color="inherit"
                  fontWeight={500}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {alias}
                </Text>
              ) : (
                <MiddleEllipsis text={address} fontSize={fontSize} fontWeight={500} />
              )}
            </Flex>
          </Box>
        ) : (
          <Text fontSize={fontSize} color="inherit" fontWeight={500} style={{ margin: 'auto' }}>
            {connectLabel}
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
