import { Box, FabricTheme, Shelf, Spinner, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import type { State } from './types'
import { useNetworkIcon } from './utils'

type SelectButtonProps = {
  active?: boolean
  onClick?: () => void
  href?: string
  disabled?: boolean
  muted?: boolean
  loading?: boolean
  logo?: React.ReactNode
  children: React.ReactNode
  iconRight?: React.ReactNode
}

const Root = styled(Box)<{ disabled: boolean; muted?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  appearance: none;
  outline: none;

  opacity: ${({ disabled, muted }) => (disabled || muted ? 0.2 : 1)};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  &:focus-visible:not(:disabled) {
    outline: ${({ theme }) => `solid ${theme.colors.borderSelected}`};
  }
`

export function SelectButton({
  active = false,
  onClick,
  disabled = false,
  muted = false,
  ...restProps
}: SelectButtonProps) {
  return (
    <Root
      onClick={onClick}
      as="button"
      type="button"
      disabled={disabled}
      p={2}
      border={0}
      borderRadius="input"
      textAlign="center"
      backgroundColor={active ? 'backgroundSecondary' : 'backgroundPrimary'}
      muted={muted}
    >
      <Content {...restProps} />
    </Root>
  )
}

export function SelectAnchor({
  active = false,
  href,
  disabled = false,
  muted = false,
  ...restProps
}: SelectButtonProps) {
  return (
    <Root
      as="a"
      href={href}
      target="_blank"
      p={2}
      borderRadius="input"
      disabled={disabled}
      backgroundColor={active ? 'backgroundSecondary' : 'backgroundPrimary'}
      muted={muted}
    >
      <Content {...restProps} />
    </Root>
  )
}

const PlainButton = styled.button<{ $left?: boolean }>({
  display: 'flex',
  border: 0,
  appearance: 'none',
  cursor: 'pointer',
  background: 'transparent',
})

type IconComponent = React.ComponentType<{ size?: string | number }>

export function LogoButton({
  icon,
  size = 'iconRegular',
  ...rest
}: { icon: string | IconComponent; size?: NetworkIconProps['size'] } & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <PlainButton type="button" {...rest}>
      <Logo icon={icon} size={size} />
    </PlainButton>
  )
}

export function Logo({
  icon: Icon,
  size = 'iconRegular',
}: {
  icon: string | IconComponent
  size?: NetworkIconProps['size']
}) {
  if (!Icon) return null
  if (typeof Icon === 'string') {
    return <Box as="img" src={Icon} alt="" width={size} height={size} style={{ objectFit: 'contain' }} />
  }
  return <Icon size={size} />
}

function Content({ loading = false, logo, children, iconRight }: SelectButtonProps) {
  const { sizes } = useTheme()

  return (
    <>
      {loading ? <Spinner size={sizes.iconRegular} /> : logo ? logo : <FallbackLogo />}

      {!iconRight ? (
        <Label>{children}</Label>
      ) : (
        <Shelf as="span" gap={1} alignItems="center">
          <Label>{children}</Label>
          {iconRight}
        </Shelf>
      )}
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text as="span" variant="interactive1">
      {children}
    </Text>
  )
}

function FallbackLogo() {
  const { sizes } = useTheme()

  return <Box width={sizes.iconRegular} height={sizes.iconRegular} borderRadius="50%" backgroundColor="textDisabled" />
}

export type NetworkIconProps = {
  network: Exclude<State['walletDialog']['network'], null>
  size?: FabricTheme['sizes']['iconSmall' | 'iconMedium' | 'iconRegular' | 'iconLarge']
  disabled?: boolean
}

export function NetworkIcon({ network, size = 'iconRegular' }: NetworkIconProps) {
  return <Logo icon={useNetworkIcon(network)} size={size} />
}
