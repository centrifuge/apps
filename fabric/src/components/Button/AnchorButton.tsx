import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { VisualButton, VisualButtonProps } from './VisualButton'

export type AnchorButtonProps = VisualButtonProps & React.ComponentPropsWithoutRef<'a'>

const StyledAnchor = styled.a<{ $disabled?: boolean }>(
  css({
    display: 'inline-block',
    textDecoration: 'none',
    outline: '0',
  }),
  (props) => props.$disabled && { pointerEvents: 'none' }
)

export const AnchorButton: React.FC<AnchorButtonProps> = ({
  variant,
  small,
  icon,
  iconRight,
  disabled,
  loading,
  children,
  active,
  ...anchorProps
}) => {
  return (
    <StyledAnchor $disabled={loading || disabled} target="_blank" rel="noopener noreferrer" {...anchorProps}>
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
    </StyledAnchor>
  )
}
