import { Box, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { LoadBoundary } from '../LoadBoundary'
import { SideBar } from './SideBar'

type Props = {}

export const PageWithSideBar: React.FC<Props> = ({ children }) => {
  return (
    <Shelf minHeight="100vh" alignItems="stretch">
      <BoxWithBorder width={220}>
        <SideBar />
      </BoxWithBorder>
      <Box display="flex" mx={5} my={3} flexGrow={1} as="main">
        <LoadBoundary>{children}</LoadBoundary>
      </Box>
    </Shelf>
  )
}

const BoxWithBorder = styled(Box)`
  border-right: 1px solid ${({ theme }) => theme.colors.borderPrimary};
`
