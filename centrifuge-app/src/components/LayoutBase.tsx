import { Box, Grid } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

type LayoutBaseProps = {
  title?: React.ReactNode
  main?: React.ReactNode
}

const HEADER_HEIGHT = 56
const TOOLBAR_HEIGHT = 75

const Root = styled(Grid)`
  min-height: 100vh;

  @supports (min-height: 100dvh) {
    min-height: 100dvh;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['S']}) {
    height: 100vh;
    overflow: auto;

    @supports (height: 100dvh) {
      height: 100dvh;
    }
  }

  align-items: start;
  grid-template-rows: ${HEADER_HEIGHT}px auto 1fr auto ${TOOLBAR_HEIGHT}px;
  grid-template-columns: 120px 1fr;
  grid-template-areas:
    'logo wallet'
    'title title'
    'main main'
    'footer footer'
    'toolbar toolbar';

  @media (min-width: ${({ theme }) => theme.breakpoints['S']}) {
    grid-template-rows: ${HEADER_HEIGHT}px minmax(max-content, 1fr) auto;
    grid-template-columns: 80px 1fr 100px;
    grid-template-areas:
      'logo title wallet'
      'toolbar main main'
      'footer main main';
  }
`

export function LayoutBase({ title, main }: LayoutBaseProps) {
  return (
    <Root>
      <Box backgroundColor="pink" gridArea={['logo']} position={['sticky']} top={0} height={HEADER_HEIGHT}>
        logo
      </Box>

      <Box backgroundColor="purple" gridArea={['wallet']} position={['sticky']} top={0} height={HEADER_HEIGHT}>
        wallet
      </Box>

      <Box
        as="aside"
        backgroundColor="tomato"
        gridArea={['toolbar']}
        position={['sticky']}
        left={[0]}
        top={['auto', HEADER_HEIGHT]}
        bottom={[0, 'auto']}
        height={[TOOLBAR_HEIGHT, 'auto']}
      >
        toolbar
      </Box>

      <Box
        backgroundColor="yellow"
        gridArea={['title']}
        position={['static', 'sticky']}
        top={['auto', 0]}
        height={['auto', HEADER_HEIGHT]}
      >
        title
      </Box>

      <Box as="main" backgroundColor="skyblue" gridArea={['main']}>
        <Box height={3000}>main</Box>
      </Box>

      <Box as="footer" backgroundColor="gold" gridArea={['footer']} position={['static', 'sticky']} bottom={0}>
        footer
      </Box>
    </Root>
  )
}
