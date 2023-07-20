import { NavigationContainer, NavigationItem } from '@centrifuge/fabric'
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
    <NavigationContainer>
      {links.map(({ to, label }) => (
        <NavigationItem key={to} as={Link} to={to} isActive={pathname === to}>
          {label}
        </NavigationItem>
      ))}
    </NavigationContainer>
  )
}
