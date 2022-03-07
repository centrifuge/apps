import { Box, LayoutGrid, LayoutGridItem, Stack } from '@centrifuge/fabric'
import React from 'react'
import { useDebugFlags } from '../DebugFlags'
import { LoadBoundary } from '../LoadBoundary'
import { SideBar } from './SideBar'

type Props = {}

export const PageWithSideBar: React.FC<Props> = ({ children }) => {
  const showOnlyNTF = useDebugFlags().showOnlyNFT
  if (showOnlyNTF) {
    return (
      <Box minHeight="100vh" p={3}>
        {children}
      </Box>
    )
  }

  return (
    <LayoutGrid minHeight="100vh" px={['gutterMobile', 'gutterTablet', 'gutterDesktop']}>
      <LayoutGridItem
        span={[4, 4, 2]}
        order={[1, 1, 0]}
        alignSelf={['end', 'end', 'stretch']}
        borderStyle="solid"
        borderColor="borderPrimary"
        borderWidth={[0, 0, '0 1px 0 0']}
        position={['sticky', 'sticky', 'block']}
        bottom={0}
      >
        <Box position="sticky" top={3}>
          <Box position="relative" left={[0, 0, '-12px']}>
            <SideBar />
          </Box>
        </Box>
      </LayoutGridItem>
      <LayoutGridItem span={[4, 4, 6, 10]}>
        <Stack my={3} flexGrow={1} as="main">
          <LoadBoundary>{children}</LoadBoundary>
        </Stack>
      </LayoutGridItem>
    </LayoutGrid>
  )
}
