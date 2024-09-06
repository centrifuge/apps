import { VisualButton, VisualButtonProps } from '@centrifuge/fabric'
import { NavLink, NavLinkProps, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { prefetchRoute } from './Root'

export type RouterLinkButtonProps = VisualButtonProps &
  Omit<NavLinkProps, 'to'> & {
    showActive?: boolean
    goBack?: boolean
    to?: string
    newTab?: boolean
  }

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
  goBack,
  to,
  children,
  newTab = false,
  ...routeProps
}: RouterLinkButtonProps) {
  const navigate = useNavigate()

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault()

    if (newTab) {
      window.open(to, '_blank', 'noopener,noreferrer')
    } else if (goBack) {
      navigate(-1)
    } else if (to) {
      navigate(to)
    }
  }

  return (
    <StyledLink
      $disabled={loading || disabled}
      to={to || ''}
      {...routeProps}
      onMouseOver={() => to && !goBack && prefetchRoute(to)}
      onClick={handleClick}
    >
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
