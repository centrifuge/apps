import { Box, BoxProps } from 'grommet'
import React from 'react'
import styled from 'styled-components'

const StyledSecondaryHeader = styled(Box)`
  position: sticky;
  top: 56px;
  z-index: 1;
`

const SecondaryHeader: React.FC<BoxProps> = ({ children, ...rest }) => {
  return (
    <StyledSecondaryHeader background="rgb(249, 249, 249)" justify="between" direction="row" align="center" {...rest}>
      {children}
    </StyledSecondaryHeader>
  )
}

export default SecondaryHeader
