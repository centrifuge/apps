import React from 'react'
import { useTheme } from 'styled-components'
import { Box } from '../Box'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

type ToggleProps = {
  active: string
}

export const Toggle: React.FC<ToggleProps> = ({ children, active }) => {
  const theme = useTheme()

  const inactiveStyle = {
    borderRadius: '20px',
    padding: '8px 16px',
  }

  const activeStyle = {
    boxShadow: theme.shadows.cardInteractive,
    background: theme.colors.backgroundPage,
    color: theme.colors.textInteractive,
    ...inactiveStyle,
  }

  return (
    <Shelf bg="backgroundSecondary" borderRadius="20px" p="5px">
      {React.Children.map(children, (child) => {
        const isActive = `/${active}` === child?.props?.to
        console.log('🚀 ~ isActive', isActive, active)
        if (React.isValidElement(child) && active) {
          return (
            <Box style={{ borderRadius: '20px', padding: isActive ? '' : '8px 16px' }}>
              <Text variant="interactive2">
                {React.cloneElement(child, {
                  ...child.props,
                  activeStyle: isActive ? activeStyle : inactiveStyle,
                  style: { color: 'inherit' },
                })}
              </Text>
            </Box>
          )
        } else throw new Error('child must have to prop')
      })}
    </Shelf>
  )
}
