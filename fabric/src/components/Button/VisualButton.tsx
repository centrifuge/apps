import css from '@styled-system/css'
import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import { IconSpinner } from '../../icon'
import { Size } from '../../utils/types'
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
  icon?: React.ComponentType<IconProps>
  iconRight?: React.ComponentType<IconProps>
  disabled?: boolean
  loading?: boolean
}>

type StyledProps = {
  $variant?: 'contained' | 'outlined' | 'text'
  $small?: boolean
  $disabled?: boolean
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
  ({ $variant, $disabled, $small }) => {
    let fg = $disabled ? 'textDisabled' : 'textPrimary'
    let bg = $variant === 'text' ? 'transparent' : 'backgroundPrimary'
    let fgHover = 'brand'
    let bgHover = ''
    const borderWidth = $variant === 'outlined' ? 1 : 0

    if ($variant === 'contained') {
      ;[fg, bg, fgHover, bgHover] = [bg, fg, bgHover, fgHover]
    }

    return css({
      color: fg,
      backgroundColor: bg,
      borderColor: fg,
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
}) => {
  const iconSize = variant !== 'text' || small ? 'iconSmall' : 'iconMedium'
  const disabled = disabledProp || loading

  return (
    <StyledButton $variant={variant} $disabled={disabled} $small={small}>
      <SpinnerWrapper $loading={loading}>
        <Shelf gap={1} px={2} py={small ? '5px' : '8px'}>
          {IconComp && <IconComp size={iconSize} />}
          {children && (
            <Text fontSize={small ? 14 : 16} color="inherit" fontWeight={500}>
              {children}
            </Text>
          )}
          {IconRightComp && <IconRightComp size="iconSmall" />}
        </Shelf>
        <Spinner size="iconMedium" />
      </SpinnerWrapper>
    </StyledButton>
  )
}
