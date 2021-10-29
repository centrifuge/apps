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
  variant?: 'contained' | 'outlined' | 'text'
  small?: boolean
  icon?: React.ComponentType<IconProps> | React.ReactElement
  iconRight?: React.ComponentType<IconProps> | React.ReactElement
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
  ({ $variant, $disabled, $small, $active, theme }) => {
    let fg = $disabled ? 'textDisabled' : 'textPrimary'
    let bg = $variant === 'contained' ? 'backgroundPrimary' : 'transparent'
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
      borderWidth,
      pointerEvents: $disabled ? 'none' : 'initial',
      minHeight: $small ? 32 : 40,

      '&:hover, &:active': {
        color: fgHover,
        borderColor: fgHover,
        backgroundColor: bgHover,
      },

      '&:active': {
        '--fabric-color-focus': theme.colors[$variant === 'contained' ? bg : fgHover],
        boxShadow: $variant !== 'text' ? 'buttonFocused' : 'none',
      },

      'a:focus-visible &, button:focus-visible &': {
        boxShadow: $variant !== 'text' ? 'buttonFocused' : 'none !important', // styled components renders the focus style also when $variant === 'text' for some reason
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

const ClickableArea = styled.div`
  width: auto;
  height: 100%;
  position: absolute;
  left: -8px;
  right: -8px;
  top: 0;
`

export const VisualButton: React.FC<VisualButtonProps> = ({
  variant = 'contained',
  small,
  icon: IconComp,
  iconRight: IconRightComp,
  disabled,
  loading,
  children,
  active,
}) => {
  const iconSize = variant !== 'text' || small ? 'iconSmall' : 'iconMedium'

  return (
    <StyledButton $variant={variant} $disabled={disabled} $small={small} $active={active}>
      <SpinnerWrapper $loading={loading}>
        <Shelf gap={1} px={variant === 'text' ? 0 : 2} py={small ? '5px' : '8px'} position="relative">
          {variant === 'text' && <ClickableArea />}
          {IconComp && <Flex bleedY="5px">{isComponent(IconComp) ? <IconComp size={iconSize} /> : IconComp}</Flex>}
          {children && (
            <Text fontSize={small ? 14 : 16} color="inherit" fontWeight={500}>
              {children}
            </Text>
          )}
          {IconRightComp && (isComponent(IconRightComp) ? <IconRightComp size="iconSmall" /> : IconRightComp)}
        </Shelf>
        <Spinner size={small ? 'iconSmall' : 'iconMedium'} />
      </SpinnerWrapper>
    </StyledButton>
  )
}

function isComponent(object: any): object is React.ComponentType {
  return typeof object === 'function'
}
