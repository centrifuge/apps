import { SideNavigationContainer, SideNavigationItem } from '@centrifuge/fabric'
import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'

export function MenuSwitch({ links }: { links: { to: string; label: string }[] }) {
  const { pathname } = useLocation()
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
