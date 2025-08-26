import { WalletMenu } from '@centrifuge/centrifuge-react'
import { Box, Drawer, IconButton, IconHamburger, IconX } from '@centrifuge/fabric'
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import styled, { useTheme } from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { useDebugFlags } from '../DebugFlags/context'
import { Footer } from '../Footer'
import { LogoCentrifugeText } from '../LogoCentrifuge'
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
`

const MobileHeader = styled.header`
  display: flex;
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
  padding: 1rem;
  @media (min-width: ${({ theme }) => theme.breakpoints.L}) {
    margin-left: 220px;
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.L}) and (min-width: ${({ theme }) => theme.breakpoints.M}) {
    margin-left: 0;
    padding-top: 60px;
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
    <Box>
      <Menu />
    </Box>
    <Footer />
  </>
)

export const LayoutBase = () => {
  const theme = useTheme()
  const location = useLocation()
  const isDesktop = useIsAboveBreakpoint('L')
  const isMedium = useIsAboveBreakpoint('M')
  const { hideApp } = useDebugFlags()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close the mobile menu when the location changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  if (hideApp && !location.pathname.startsWith('/migrate')) {
    return <Navigate to="/migrate" replace />
  }

  return (
    <Box backgroundColor={hideApp ? 'backgroundSecondary' : 'white'}>
      {isDesktop && !hideApp && (
        <Box position="fixed" top="1rem" right="1rem" zIndex={theme.zIndices.header} mt={2} marginRight={1}>
          <WalletMenu />
        </Box>
      )}

      {hideApp && (
        <Box>
          <Box paddingTop="26px" pl={6}>
            <LogoCentrifugeText width={60} height={60} />
          </Box>

          <Box position="fixed" top="1rem" right="1rem" zIndex={theme.zIndices.header} mt={2} marginRight={1}>
            <WalletMenu />
          </Box>
        </Box>
      )}

      {!isDesktop && !hideApp && (
        <MobileHeader>
          <LogoLink />
          <Box display="flex" alignItems="center" marginLeft="auto">
            <Box mr={2} width={220}>
              <WalletMenu />
            </Box>
            <IconButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? (
                <IconX color="white" size="iconLarge" />
              ) : (
                <IconHamburger color="white" size="iconLarge" />
              )}
            </IconButton>
          </Box>
        </MobileHeader>
      )}

      {isDesktop && !hideApp && (
        <Sidebar>
          <SidebarMenu />
        </Sidebar>
      )}

      {!isDesktop && !hideApp && (
        <Drawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title="Menu"
          backgroundColor="backgroundInverted"
          width={isMedium ? '400px' : '100%'}
          hideIcon
        >
          <MobileMenuContent />
        </Drawer>
      )}

      {hideApp ? (
        <Outlet />
      ) : (
        <Content>
          <Box mx={2}>
            <Outlet />
          </Box>
        </Content>
      )}
    </Box>
  )
}
