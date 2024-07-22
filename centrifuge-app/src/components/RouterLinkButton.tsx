import { VisualButton, VisualButtonProps } from '@centrifuge/fabric'
import { NavLink, NavLinkProps } from 'react-router-dom'
import styled from 'styled-components'
import { prefetchRoute } from './Root'

export type RouterLinkButtonProps = VisualButtonProps & NavLinkProps & { showActive?: boolean }

const StyledLink = styled(NavLink)<{ $disabled?: boolean }>(
  {
    display: 'inline-block',
    textDecoration: 'none',
    outline: '0',
  },
  (props) => props.$disabled && { pointerEvents: 'none' }
)

export function RouterLinkButton({
  variant,
  small,
  icon,
  iconRight,
  disabled,
  loading,
  loadingMessage,
  children,
  ...routeProps
}: RouterLinkButtonProps) {
  return (
    <StyledLink $disabled={loading || disabled} {...routeProps} onMouseOver={() => prefetchRoute(routeProps.to)}>
      <VisualButton
        variant={variant}
        small={small}
        icon={icon}
        iconRight={iconRight}
        disabled={disabled}
        loading={loading}
        loadingMessage={loadingMessage}
      >
        {children}
      </VisualButton>
    </StyledLink>
  )
}
