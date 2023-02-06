import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { NavLink, useLocation, useRouteMatch } from 'react-router-dom'
import { useTheme } from 'styled-components'

export const MenuSwitch: React.VFC = () => {
  const theme = useTheme()
  const { pathname } = useLocation()
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''

  const links = [
    { to: `${basePath}`, label: 'Pools' },
    { to: `${basePath}/tokens`, label: 'Tokens' },
  ]

  const activeStyle = {
    boxShadow: theme.shadows.cardInteractive,
    background: theme.colors.backgroundPage,
  }

  return (
    <Shelf as="nav" bg="backgroundSecondary" borderRadius="20px" p="5px">
      {links.map((link) => (
        <Box borderRadius="20px" key={`${link.to}-${link.label}`}>
          <NavLink
            to={link.to}
            style={{ padding: '8px 16px', borderRadius: '20px', display: 'block' }}
            activeStyle={pathname === link.to ? activeStyle : {}}
          >
            <Text
              variant="interactive2"
              color={pathname === link.to ? theme.colors.textInteractive : theme.colors.textPrimary}
            >
              {link.label}
            </Text>
          </NavLink>
        </Box>
      ))}
    </Shelf>
  )
}
