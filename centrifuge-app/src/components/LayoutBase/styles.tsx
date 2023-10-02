import { Box, Grid, Shelf, Stack } from '@centrifuge/fabric'
import styled from 'styled-components'

// the main breakpoint to switch from stacked to columns layout
const BREAK_POINT_COLUMNS = 'M'
// breakpoint from minimal to extended left sidebar width
const BREAK_POINT_SIDEBAR_EXTENDED = 'L'

const HEADER_HEIGHT = 60
const TOOLBAR_HEIGHT = 50
const SIDEBAR_WIDTH = 80
const SIDEBAR_WIDTH_EXTENDED = 220
const LAYOUT_MAX_WIDTH = 1800

export const Root = styled(Box)`
  position: relative;
  min-height: 100vh;

  @supports (min-height: 100dvh) {
    min-height: 100dvh;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    height: 100vh;
    overflow: auto;

    @supports (height: 100dvh) {
      height: 100dvh;
    }
  }
`

export const Inner = styled(Grid)`
  min-height: 100%;

  align-items: start;
  grid-template-rows: 0px ${HEADER_HEIGHT}px 1fr auto ${TOOLBAR_HEIGHT}px;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'header-background header-background'
    'logo wallet'
    'main main'
    'footer footer'
    'toolbar toolbar';

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    grid-template-rows: ${HEADER_HEIGHT}px minmax(max-content, 1fr) auto;
    grid-template-columns: ${SIDEBAR_WIDTH}px 1fr;
    grid-template-areas:
      'logo wallet'
      'toolbar main'
      'footer main';
  }

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_SIDEBAR_EXTENDED]}) {
    grid-template-columns: ${SIDEBAR_WIDTH_EXTENDED}px 1fr;
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

  background-color: ${({ theme }) => theme.colors.backgroundPrimary};
  border-bottom: ${({ theme }) => `1px solid ${theme.colors.borderSecondary}`};

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    display: none;
  }
`

export const ToolbarContainer = styled(Box)`
  z-index: ${({ theme }) => theme.zIndices.header};
  grid-area: toolbar;
  position: sticky;
  left: 0;
  bottom: 0;
  height: ${TOOLBAR_HEIGHT}px;

  border-top: ${({ theme }) => `1px solid ${theme.colors.borderSecondary}`};
  background-color: ${({ theme }) => theme.colors.backgroundPrimary};

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    top: ${({ theme }) => theme.space[4] + HEADER_HEIGHT}px;
    bottom: auto;
    height: auto;

    border-top: 0;
    background-color: transparent;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_SIDEBAR_EXTENDED]}) {
    padding: ${({ theme }) => theme.space[2]}px;
  }
`

export const LogoContainer = styled(Stack)`
  z-index: ${({ theme }) => theme.zIndices.header};
  position: sticky;
  top: 0;

  grid-area: logo;
  height: ${HEADER_HEIGHT}px;
  padding-left: ${({ theme }) => theme.space[2]}px;
  justify-content: center;

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    justify-content: start;
    padding-top: ${({ theme }) => theme.space[2]}px;
  }
`

export const WalletContainer = styled(Stack)`
  z-index: ${({ theme }) => theme.zIndices.header};
  /* position: sticky; */
  top: 0;
  grid-area: wallet;
  // WalletContainer & WalletPositioner are positioned above the main content and would block user interaction (click).
  // disabling pointer-events here and enable again on WalletInner
  pointer-events: none;
`

export const WalletPositioner = styled(Shelf)`
  max-width: ${LAYOUT_MAX_WIDTH}px;
  justify-content: flex-end;
  align-items: flex-start;
`

export const WalletInner = styled(Stack)`
  height: ${HEADER_HEIGHT}px;
  justify-content: center;
  pointer-events: auto; // resetting pointer events

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    justify-content: flex-end;
  }
`

export const MainContainer = styled(Box)`
  grid-area: main;
  align-self: stretch;

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    margin-top: calc(${HEADER_HEIGHT}px * -1);
    border-left: ${({ theme }) => `1px solid ${theme.colors.borderSecondary}`};
  }
`

export const FooterContainer = styled(Box)`
  grid-area: footer;

  @media (min-width: ${({ theme }) => theme.breakpoints[BREAK_POINT_COLUMNS]}) {
    position: sticky;
    bottom: 0;
  }
`
