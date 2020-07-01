import React from 'react';
import { Box } from 'grommet';
import styled, { withTheme } from 'styled-components';

const StyledSecondaryHeader = styled(Box)`
  position: sticky;
  top: 56px ;
  z-index: 1;
`;

const SecondaryHeader = withTheme((props) => {
  const { children, ...rest } = props;

  return (
    <StyledSecondaryHeader
      background="white"
      justify="between"
      direction="row"
      align="center"
      {...rest}>
      {children}
    </StyledSecondaryHeader>
  );
});

export default SecondaryHeader;
