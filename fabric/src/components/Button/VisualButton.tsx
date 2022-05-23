import css from '@styled-system/css'
import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import { IconSpinner } from '../../icon'
import { Size } from '../../utils/types'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

const rotate = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(1turn);
  }
`

type IconProps = {
  size?: ResponsiveValue<Size>
}

export type VisualButtonProps = React.PropsWithChildren<{
  variant?: 'primary' | 'secondary' | 'tertiary' | 'wallet'
  small?: boolean
  icon?: React.ComponentType<IconProps> | React.ReactElement
  iconRight?: React.ComponentType<IconProps> | React.ReactElement
  disabled?: boolean
  loading?: boolean
  loadingMessage?: string
  active?: boolean
}>

type StyledProps = {
  $variant: 'primary' | 'secondary' | 'tertiary' | 'wallet'
  $iconOnly?: boolean
  $small?: boolean
  $disabled?: boolean
  $active?: boolean
  $loading?: boolean
}

const LoadingContent = styled(Shelf)`
  pointer-events: none;
`
const DefaultContent = styled(Shelf)`
  width: 100%;
`

export const StyledButton = styled.span<StyledProps>(
  {
    position: 'relative',
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '100%',
    gridTemplateRows: 'auto',
    gridTemplateAreas: "'unit'",
    cursor: 'pointer',
    borderRadius: 40,
    transitionProperty: 'color, background-color, border-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-in-out',
    borderStyle: 'solid',
    userSelect: 'none',

    [`${LoadingContent}, ${DefaultContent}`]: {
      gridArea: 'unit',
      justifySelf: 'center',
    },
  },
  ({ $variant, $disabled, $small, $active, $iconOnly, $loading, theme }) => {
    const isTertiaryIcon = $variant === 'tertiary' && $iconOnly
    const variant = $variant === 'wallet' ? 'secondary' : $variant
    const variantToken = variant[0].toUpperCase().concat(variant.slice(1))
    const bg = `backgroundButton${variantToken}`
    const bgFocus = `backgroundButton${variantToken}Focus`
    const bgHover = `backgroundButton${variantToken}Hover`
    const bgPressed = `backgroundButton${variantToken}Pressed`
    const bgDisabled = `backgroundButton${variantToken}Disabled`
    const fg = `textButton${variantToken}`
    const fgFocus = `textButton${variantToken}Focus`
    const fgHover = `textButton${variantToken}Hover`
    const fgPressed = `textButton${variantToken}Pressed`
    const fgDisabled = `textButton${variantToken}Disabled`
    const border = `borderButton${variantToken}`
    const borderFocus = `borderButton${variantToken}Focus`
    const borderHover = `borderButton${variantToken}Hover`
    const borderPressed = `borderButton${variantToken}Pressed`
    const borderDisabled = `borderButton${variantToken}Disabled`
    const shadow = `shadowButton${variantToken}Pressed`

    return css({
      color: $disabled ? fgDisabled : $active ? fgPressed : fg,
      backgroundColor: $disabled ? bgDisabled : $active && !isTertiaryIcon ? bgPressed : bg,
      borderColor: $disabled ? borderDisabled : $active ? borderPressed : border,
      borderWidth: 1,
      pointerEvents: $disabled ? 'none' : 'initial',
      minHeight: $small ? 32 : 40,
      '--fabric-color-focus': theme.colors[shadow],
      boxShadow:
        $active && variant === 'secondary' ? 'buttonActive' : $variant === 'wallet' ? 'cardInteractive' : 'none',

      '&:hover': {
        color: fgHover,
        backgroundColor: isTertiaryIcon ? undefined : bgHover,
        borderColor: isTertiaryIcon ? undefined : borderHover,
        boxShadow: variant === 'secondary' ? 'buttonActive' : 'none',
      },
      '&:active': {
        color: fgPressed,
        backgroundColor: isTertiaryIcon ? undefined : bgPressed,
        borderColor: isTertiaryIcon ? undefined : borderPressed,
        boxShadow: variant !== 'tertiary' ? 'buttonActive' : 'none',
      },

      'a:focus-visible &, button:focus-visible &': {
        color: fgFocus,
        backgroundColor: isTertiaryIcon ? undefined : bgFocus,
        borderColor: borderFocus,
      },

      '& > :last-child': {
        opacity: $loading ? 1 : 0,
      },
      '& > :first-child': {
        opacity: $loading ? 0 : 1,
      },
    })
  }
)

const Spinner = styled(IconSpinner)`
  animation: ${rotate} 600ms linear infinite;
`

export const VisualButton: React.FC<VisualButtonProps> = ({
  variant = 'primary',
  small,
  icon: IconComp,
  iconRight: IconRightComp,
  disabled,
  loading,
  loadingMessage,
  children,
  active,
}) => {
  const isTertiaryIcon = variant === 'tertiary' && !children
  const isWallet = variant === 'wallet'
  const px = isWallet ? '12px' : isTertiaryIcon ? 1 : variant === 'tertiary' || small ? 2 : 3
  const iconSize = isTertiaryIcon && !small ? 'iconMedium' : 'iconSmall'

  return (
    <StyledButton
      $variant={variant}
      $disabled={disabled}
      $small={small}
      $active={active}
      $iconOnly={!children}
      $loading={loading}
    >
      <DefaultContent
        gap={1}
        px={px}
        py={small ? '5px' : '7px'}
        position="relative"
        justifyContent={isWallet ? 'start' : 'center'}
      >
        {IconComp && (
          <Flex bleedY="8px" ml={isWallet ? '-4px' : undefined}>
            {isComponent(IconComp) ? <IconComp size={iconSize} /> : IconComp}
          </Flex>
        )}
        {isWallet ? (
          children
        ) : (
          <>
            {children && (
              <Text fontSize={small ? 14 : 16} color="inherit" fontWeight={500}>
                {children}
              </Text>
            )}
          </>
        )}
        {IconRightComp && (isComponent(IconRightComp) ? <IconRightComp size="iconSmall" /> : IconRightComp)}
      </DefaultContent>
      <LoadingContent px={px} gap={1} justifyContent="center">
        <Spinner size={small ? 'iconSmall' : 'iconMedium'} />
        {loadingMessage && (
          <Text fontSize={small ? 14 : 16} color="inherit" fontWeight={500}>
            {loadingMessage}
          </Text>
        )}
      </LoadingContent>
    </StyledButton>
  )
}

function isComponent(object: any): object is React.ComponentType {
  return typeof object === 'function'
}
