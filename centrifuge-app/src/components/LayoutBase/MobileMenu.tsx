import { Box, Drawer, IconButton, IconHamburger } from '@centrifuge/fabric'
import { useState } from 'react'
import { useTheme } from 'styled-components'
import { Menu } from '../Menu'

export const MobileMenu = () => {
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Box position="absolute" right={0} zIndex={99}>
      {isOpen ? null : (
        <IconButton onClick={() => setIsOpen(true)} variant="tertiary">
          <IconHamburger />
        </IconButton>
      )}

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Menu"
        width="100vh"
        backgroundColor="backgroundInverted"
      >
        <Menu />
      </Drawer>
    </Box>
  )
}
