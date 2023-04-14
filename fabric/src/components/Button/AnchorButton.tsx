import css from '@styled-system/css'
import * as React from 'react'
import { Link } from 'react-router-dom'
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
  loadingMessage,
  children,
  active,
  href,
  ...anchorProps
}) => {
  const isExternal = !href?.startsWith('/')

  return (
    <StyledAnchor
      $disabled={loading || disabled}
      as={isExternal ? 'a' : Link}
      {...(!isExternal ? { to: href } : {})}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      {...anchorProps}
    >
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
