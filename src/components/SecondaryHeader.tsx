import React from 'react';
import { Box } from 'grommet';
import styled, { withTheme } from 'styled-components';



const StyledSecondaryHeader = styled(Box)`
  position: sticky;
  top: 90px ;
  z-index: 2;
`;


export const SecondaryHeader = withTheme(props => {
  const { children, ...rest } = props;

  return (
    <StyledSecondaryHeader
      background='white'
      pad={{horizontal:'medium'}}
      justify="between"
      direction="row"
      align="center"
      {...rest}>
      {children}
    </StyledSecondaryHeader>

  );
});

