import { Box, Drawer, IconButton, IconHamburger } from '@centrifuge/fabric'
import { useState } from 'react'
import { Outlet } from 'react-router'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { Footer } from '../Footer'
import { LogoLink } from '../LogoLink-deprecated'
import { Menu } from '../Menu'

const Sidebar = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.backgroundInverted};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  width: 220px;

  @media (max-width: ${({ theme }) => theme.breakpoints.L}) and (min-width: ${({ theme }) => theme.breakpoints.M}) {
    width: 90px;
  }
`

const MobileHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.backgroundInverted};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1100;
`

const Content = styled.main`
  margin-left: 220px;
  padding: 1rem;
  @media (max-width: ${({ theme }) => theme.breakpoints.L}) and (min-width: ${({ theme }) => theme.breakpoints.M}) {
    margin-left: 80px;
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.M}) {
    margin-left: 0;
    padding-top: 60px;
  }
`

const SidebarMenu = () => (
  <>
    <Box>
      <LogoLink />
      <Menu />
    </Box>
    <Footer />
  </>
)

const MobileMenuContent = () => (
  <>
    <Menu />
    <Footer />
  </>
)

export const LayoutBase = () => {
  const isDesktop = useIsAboveBreakpoint('L')

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {isDesktop && (
        <Sidebar>
          <SidebarMenu />
        </Sidebar>
      )}

      {!isDesktop && (
        <MobileHeader>
          <div>
            <LogoLink />
          </div>
          <IconButton onClick={() => setMobileMenuOpen(true)}>
            <IconHamburger color="white" size="iconLarge" />
          </IconButton>
        </MobileHeader>
      )}

      {!isDesktop && (
        <Drawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title="Menu"
          backgroundColor="backgroundInverted"
        >
          <MobileMenuContent />
        </Drawer>
      )}

      <Content>
        <Outlet />
      </Content>
    </>
  )
}
