import { Box, Shelf, Text } from '@centrifuge/fabric'
import React from 'react'
import { NavLink, useRouteMatch } from 'react-router-dom'
import { useTheme } from 'styled-components'

const links = [
  { to: '/pools', label: 'Pools' },
  { to: '/tokens', label: 'Tokens' },
]

export const MenuSwitch: React.VFC = () => {
  const theme = useTheme()
  const { path } = useRouteMatch()
  const inactiveStyle = {
    borderRadius: '20px',
    padding: '8px 16px',
    display: 'block',
  }

  const activeStyle = {
    ...inactiveStyle,
    boxShadow: theme.shadows.cardInteractive,
    background: theme.colors.backgroundPage,
  }

  return (
    <Shelf as="nav" bg="backgroundSecondary" borderRadius="20px" p="5px">
      {links.map((link) => (
        <Box borderRadius="20px" padding={path === link.to ? '0px' : '8px 16px'}>
          <NavLink to={link.to} activeStyle={path === link.to ? activeStyle : inactiveStyle}>
            <Text
              variant="interactive2"
              color={path === link.to ? theme.colors.textInteractive : theme.colors.textPrimary}
            >
              {link.label}
            </Text>
          </NavLink>
        </Box>
      ))}
    </Shelf>
  )
}
