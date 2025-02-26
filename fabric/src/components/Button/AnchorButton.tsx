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

export function AnchorButton({
  variant,
  small,
  icon,
  iconRight,
  disabled,
  loading,
  loadingMessage,
  children,
  active,
  ...anchorProps
}: AnchorButtonProps) {
  return (
    <StyledAnchor $disabled={loading || disabled} rel="noopener noreferrer" {...anchorProps}>
      <VisualButton
        variant={variant}
        small={small}
        icon={icon}
        iconRight={iconRight}
        disabled={disabled}
        loading={loading}
        loadingMessage={loadingMessage}
        active={active}
      >
        {children}
      </VisualButton>
    </StyledAnchor>
  )
}
