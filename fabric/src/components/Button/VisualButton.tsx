import css from '@styled-system/css'
import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import { IconSpinner } from '../../icon'
import { Size } from '../../utils/types'
import { Box } from '../Box'
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
  variant?: 'contained' | 'outlined' | 'text'
  small?: boolean
  icon?: React.ComponentType<IconProps> | React.ReactNode
  iconRight?: React.ComponentType<IconProps>
  disabled?: boolean
  loading?: boolean
  active?: boolean
}>

type StyledProps = {
  $variant?: 'contained' | 'outlined' | 'text'
  $small?: boolean
  $disabled?: boolean
  $active?: boolean
}

export const StyledButton = styled.span<StyledProps>(
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: 40,
    transitionProperty: 'color, background-color, border-color, box-shadow',
    transitionDuration: '100ms',
    transitionTimingFunction: 'ease-in-out',
    borderStyle: 'solid',
    userSelect: 'none',
  },
  ({ $variant, $disabled, $small, $active }) => {
    let fg = $disabled ? 'textDisabled' : 'textPrimary'
    let bg = $variant === 'text' ? 'transparent' : 'backgroundPrimary'
    let fgHover = 'brand'
    let bgHover = ''
    const borderWidth = $variant === 'outlined' ? 1 : 0

    if ($variant === 'contained') {
      ;[fg, bg, fgHover, bgHover] = [bg, fg, bgHover, fgHover]
    }

    return css({
      color: ($active && fgHover) || fg,
      backgroundColor: ($active && bgHover) || bg,
      borderColor: ($active && fgHover) || fg,
      borderWidth: borderWidth,
      pointerEvents: $disabled ? 'none' : 'initial',
      minHeight: $small ? 32 : 40,

      '&:hover, &:active': {
        color: fgHover,
        borderColor: fgHover,
        backgroundColor: bgHover,
      },

      '&:active': {
        boxShadow: $variant !== 'text' ? 'buttonFocused' : 'none',
      },

      'a:focus-visible &, button:focus-visible &': {
        boxShadow: $variant !== 'text' ? 'buttonFocused' : 'none',
        color: $variant === 'text' ? fgHover : undefined,
      },
    })
  }
)

const SpinnerWrapper = styled.span<{ $loading?: boolean }>`
  position: relative;

  > :last-child {
    opacity: 0;
  }

  ${(props) =>
    props.$loading &&
    `
    > :first-child {
      opacity: 0;
    }
    > :last-child {
      opacity: 1;
    }
  `}
`

const Spinner = styled(IconSpinner)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  pointer-events: none;
  animation: ${rotate} 600ms linear infinite;
`

export const VisualButton: React.FC<VisualButtonProps> = ({
  variant = 'contained',
  small,
  icon: IconComp,
  iconRight: IconRightComp,
  disabled: disabledProp,
  loading,
  children,
  active,
}) => {
  const iconSize = variant !== 'text' || small ? 'iconSmall' : 'iconMedium'
  const disabled = disabledProp || loading

  return (
    <StyledButton $variant={variant} $disabled={disabled} $small={small} $active={active}>
      <SpinnerWrapper $loading={loading}>
        <Shelf gap={1} px={2} py={small ? '5px' : '8px'}>
          {IconComp && <Box bleedY="5px">{isComponent(IconComp) ? <IconComp size={iconSize} /> : IconComp}</Box>}
          {children && (
            <Text fontSize={small ? 14 : 16} color="inherit" fontWeight={500}>
              {children}
            </Text>
          )}
          {IconRightComp && <IconRightComp size="iconSmall" />}
        </Shelf>
        <Spinner size={iconSize} />
      </SpinnerWrapper>
    </StyledButton>
  )
}

function isComponent(object: any): object is React.ComponentType {
  return typeof object === 'function'
}
