import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { VisualButton, VisualButtonProps } from './VisualButton'

export type ButtonProps = VisualButtonProps & React.ComponentPropsWithoutRef<'button'>

const StyledButton = styled.button(
  css({
    display: 'inline-block',
    padding: '0',
    border: 'none',
    appearance: 'none',
    background: 'transparent',
    outline: '0',
  })
)

export const Button: React.FC<ButtonProps> = ({
  variant,
  small,
  icon,
  iconRight,
  disabled,
  loading,
  children,
  active,
  type = 'button',
  ...buttonProps
}) => {
  return (
    <StyledButton type={type} disabled={loading || disabled} {...buttonProps}>
      <VisualButton
        variant={variant}
        small={small}
        icon={icon}
        iconRight={iconRight}
        disabled={disabled}
        loading={loading}
        active={active}
      >
        {children}
      </VisualButton>
    </StyledButton>
  )
}
