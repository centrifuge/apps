import { Box, Shelf, Text } from '@centrifuge/fabric'
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from 'styled-components'

export const MenuSwitch: React.VFC = () => {
  const theme = useTheme()
  const { pathname } = useLocation()
  const basePath = `${pathname.split('/').filter(Boolean)[0]}`

  const links = [
    { to: `/${basePath}`, label: 'Pools' },
    { to: `/${basePath}/tokens`, label: 'Tokens' },
  ]

  const inactiveStyle = {
    borderRadius: '20px',
    display: 'block',
  }

  const activeStyle = {
    ...inactiveStyle,
    padding: '8px 16px',
    boxShadow: theme.shadows.cardInteractive,
    background: theme.colors.backgroundPage,
  }

  return (
    <Shelf as="nav" bg="backgroundSecondary" borderRadius="20px" p="5px">
      {links.map((link) => (
        <Box borderRadius="20px" padding={pathname === link.to ? '0px' : '0px 16px'}>
          <NavLink to={link.to} activeStyle={pathname === link.to ? activeStyle : inactiveStyle}>
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
