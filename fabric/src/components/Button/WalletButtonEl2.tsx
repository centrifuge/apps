import Identicon from '@polkadot/react-identicon'
import { IconTheme } from '@polkadot/react-identicon/types'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { Text } from '../Text'
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
  const left = React.useRef<HTMLDivElement>(null)
  const right = React.useRef<HTMLDivElement>(null)
  const widths = React.useRef<number[]>([])
  const addressStart = (alias || address)?.slice(0, -5)
  const addressEnd = (alias || address)?.slice(-5)
  const fontSize = small ? 14 : 16

  React.useEffect(() => {
    if (!left.current || !right.current || !addressStart) return
    const w: number[] = []
    for (let i = 0; i < addressStart.length; i++) {
      w[i] = /* Math.round */ measureWidth(`${addressStart.slice(0, i)}…`, fontSize)
    }
    widths.current = w
  }, [addressStart, fontSize])

  React.useEffect(() => {
    function checkWidth() {
      if (!left.current || !right.current || !widths.current.length || !addressStart) return

      const target = Math.floor(left.current.getBoundingClientRect().width)
      const totalWidth = /* Math.round */ measureWidth(addressStart, fontSize)

      if (target >= totalWidth || target < widths.current[1]) {
        right.current.style.transform = ''
        return
      }

      const afterIndex = widths.current.findIndex((w) => w > target)
      const index = afterIndex - 1
      const width = widths.current[index]
      const diff = target - width
      console.log('width', width, target, diff, widths.current)
      right.current.style.transform = `translateX(-${Math.floor(diff)}px)`
    }

    window.addEventListener('resize', checkWidth)
    checkWidth()
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

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
              <Text
                fontSize={fontSize}
                color="inherit"
                fontWeight={500}
                style={{
                  flex: '1 1 0%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 'fit-content',
                  // transform: 'scaleX(-1)',
                  // direction: 'rtl',
                  // flex: '0 0 auto',
                }}
                ref={left}
              >
                {alias || addressStart}
              </Text>
              {!alias && (
                <Text
                  fontSize={fontSize}
                  color="inherit"
                  fontWeight={500}
                  style={{
                    flex: '0 0 auto',
                    // flex: '1 1 0%',
                    // overflow: 'hidden',
                    // textOverflow: 'ellipsis',
                    // maxWidth: 'fit-content',
                    // // transform: 'scaleX(-1)',
                    // direction: 'rtl',
                  }}
                  ref={right}
                >
                  {addressEnd}
                </Text>
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

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

function measureWidth(text: string, fontSize = 16) {
  ctx!.font = `500 ${fontSize}px Inter`
  const metrics = ctx!.measureText(text)
  const width = metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft
  return width
}
