import { SideNavigationContainer, SideNavigationItem } from '@centrifuge/fabric'
import * as React from 'react'
import { Link, useLocation, useRouteMatch } from 'react-router-dom'

export function MenuSwitch() {
  const { pathname } = useLocation()
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''

  const links = [
    {
      to: `${basePath}`,
      label: 'Pools',
    },
    {
      to: `${basePath}/tokens`,
      label: 'Tokens',
    },
  ]

  return (
    <SideNavigationContainer>
      {links.map(({ to, label }) => (
        <SideNavigationItem key={to} as={Link} to={to} $isActive={pathname === to}>
          {label}
        </SideNavigationItem>
      ))}
    </SideNavigationContainer>
  )
}
