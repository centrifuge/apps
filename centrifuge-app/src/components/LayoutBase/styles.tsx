import { Box, Grid, Shelf, Stack } from '@centrifuge/fabric'
import styled from 'styled-components'

// the main breakpoint to switch from stacked to columns layout
const BREAK_POINT_COLUMNS = 'M'

const HEADER_HEIGHT = 80

export const Root = styled(Box)`
  position: relative;
  min-height: 100vh;
  width: 100vw;
  display: flex;

  @supports (min-height: 100dvh) {
    min-height: 100dvh;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    height: 100vh;
    overflow: auto;
    width: 100vw;

    @supports (height: 100dvh) {
      height: 100dvh;
    }
  }
`

export const Inner = styled(Grid)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: transparent;
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  z-index: 2;
  padding-bottom: 1rem;
  @media (min-width: ${({ theme }) => theme.breakpoints['M']}) and (max-width: ${({ theme }) =>
      theme.breakpoints['L']}) {
    width: 7vw;
    background-color: ${({ theme }) => theme.colors.backgroundBlack};
    overflow: visible;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['L']}) {
    width: 15vw;
    background-color: ${({ theme }) => theme.colors.backgroundBlack};
    padding-left: 16px;
  }
`

export const HeaderBackground = styled(Box)`
  z-index: ${({ theme }) => theme.zIndices.header};
  position: sticky;
  top: 0;
  left: 0;

  grid-area: header-background;
  width: 100%;
  height: ${HEADER_HEIGHT}px;

  background-color: ${({ theme }) => theme.colors.backgroundBlack};
  border-bottom: ${({ theme }) => `1px solid ${theme.colors.borderPrimary}`};

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    display: none;
  }
`

export const LogoContainer = styled(Stack)`
  background-color: ${({ theme }) => theme.colors.backgroundBlack};
  z-index: ${({ theme }) => theme.zIndices.header};
  position: sticky;
  top: 0;
  width: 100%;

  grid-area: logo;
  height: ${HEADER_HEIGHT}px;
  justify-content: center;

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    justify-content: start;
    padding-top: ${({ theme }) => theme.space[2]}px;
  }
`

export const WalletContainer = styled(Stack)`
  position: fixed;
  top: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  grid-area: wallet;
  margin-right: 10px;
  pointer-events: none;

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    margin-right: 20px;
  }
`

export const WalletPositioner = styled(Shelf)`
  max-width: ${({ theme }) => theme.sizes.mainContent}px;
  justify-content: flex-end;
  align-items: flex-start;
`

export const WalletInner = styled(Stack)`
  height: ${HEADER_HEIGHT}px;
  justify-content: center;
  pointer-events: auto;
  width: 250px;

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    justify-content: flex-end;
  }
`

export const MainContainer = styled(Stack)`
  grid-area: main;
  align-self: stretch;

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    margin-top: calc(${HEADER_HEIGHT}px * -1);
    border-left: ${({ theme }) => `1px solid ${theme.colors.borderPrimary}`};
  }
`

export const FooterContainer = styled(Box)`
  margin-top: auto;
  position: sticky;
  bottom: 0;
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    position: sticky;
    bottom: 0;
  }
`

export const ToolbarContainer = styled(Box)`
  z-index: ${({ theme }) => theme.zIndices.header};
  grid-area: toolbar;
  position: sticky;
  bottom: 0;
  width: 100%;

  border-top: ${({ theme }) => `1px solid ${theme.colors.borderPrimary}`};

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    top: ${({ theme }) => theme.space[4] + HEADER_HEIGHT}px;
    bottom: auto;
    height: auto;
    border-top: 0;
    background-color: transparent;
  }
`

export const ContentWrapper = styled.div`
  width: 100%;
  margin-left: 0;
  margin-top: ${HEADER_HEIGHT}px;
  overflow-x: hidden;

  @media (min-width: ${({ theme }) => theme.breakpoints['M']}) and (max-width: ${({ theme }) =>
      theme.breakpoints['L']}) {
    margin-left: 7vw;
    width: calc(100% - 7vw);
    margin-top: 0;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['L']}) {
    margin-left: 15vw;
    width: calc(100% - 15vw);
    margin-top: 0;
  }
`
