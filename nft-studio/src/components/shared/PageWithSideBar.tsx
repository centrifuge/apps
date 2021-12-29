import { Box, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { SideBar } from './SideBar'

type Props = {}

export const PageWithSideBar: React.FC<Props> = ({ children }) => {
  return (
    <Shelf height="100vh" alignItems="stretch">
      <BoxWithBorder width={220}>
        <SideBar />
      </BoxWithBorder>
      <Box margin="60px">{children}</Box>
    </Shelf>
  )
}

const BoxWithBorder = styled(Box)`
  border-right: 1px solid ${({ theme }) => theme.colors.borderPrimary};
`
