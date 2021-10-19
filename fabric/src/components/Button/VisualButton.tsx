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
  $bg?: string
  $fg: string
  $fgHover?: string
  $bgHover?: string
  $borderWidth?: number
  $small?: string
  $disabled?: boolean
  $height?: number
  $variant?: 'contained' | 'outlined' | 'text'
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
  (props) =>
    css({
      color: props.$fg,
      backgroundColor: props.$bg,
      borderColor: props.$fg,
      borderWidth: props.$borderWidth,
      pointerEvents: props.$disabled ? 'none' : 'initial',
      height: props.$height,

      '&:hover, &:active': {
        color: props.$fgHover,
        borderColor: props.$fgHover,
        backgroundColor: props.$bgHover,
      },

      '&:active': {
        boxShadow: props.$variant !== 'text' ? 'buttonFocused' : 'none',
      },
    })
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

  let fg,
    bg,
    fgHover,
    bgHover,
    borderWidth = 0
  if (variant === 'contained') {
    fg = 'backgroundPrimary'
    bg = disabled ? 'textDisabled' : 'textPrimary'
    bgHover = 'brand'
  } else if (variant === 'outlined') {
    fg = disabled ? 'textDisabled' : 'textPrimary'
    bg = 'backgroundPrimary'
    fgHover = 'brand'
    borderWidth = 1
  } else {
    fg = disabled ? 'textDisabled' : 'textPrimary'
    fgHover = 'brand'
  }

  return (
    <StyledButton
      $variant={variant}
      $fg={fg}
      $bg={bg}
      $fgHover={fgHover}
      $bgHover={bgHover}
      $borderWidth={borderWidth}
      $disabled={disabled}
      $height={small ? 32 : 40}
    >
      <SpinnerWrapper $loading={loading}>
        <Shelf gap={1} px={2}>
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
