import { Box, Grid } from 'grommet';
import React, { FunctionComponent } from 'react';

const SpacedContent: FunctionComponent = ({ children }) => (
  <Grid
    rows={['flex']}
    columns={['auto', 'xlarge', 'auto']}
    areas={[
      { name: 'left-spacer', start: [0, 0], end: [0, 0] },
      { name: 'content', start: [1, 0], end: [1, 0] },
      { name: 'right-spacer', start: [2, 0], end: [2, 0] },
    ]}
    fill="true"
  >
    <Box gridArea="left-spacer" />
    <Box gridArea="content">{children}</Box>
    <Box gridArea="right-spacer" />
  </Grid>
);

SpacedContent.displayName = 'SpacedContent';

export default SpacedContent;
