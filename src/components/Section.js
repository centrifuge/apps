import React, { useState } from 'react';
import { withTheme } from 'styled-components';
import { Box, CheckBox, Collapsible, Heading } from 'grommet';

// TODO add this to Axis
export const Section = withTheme(props => {
  const {
    title,
    collapsibleLabel,
    collapsed,
    onCollapse,
    children,
    actions,
    headingLevel
    , ...rest
  } = props;
  const [opened, open] = useState(!collapsed);

  return (
    <Box pad={'medium'} {...rest}>
      <Box direction="row" gap="medium">
        {title &&
        <Heading margin={{ top: 'none' }} style={{ minWidth: '100px' }} level={headingLevel || 5}>{title}</Heading>}
        {collapsibleLabel && (
          <CheckBox
            label={collapsibleLabel}
            checked={opened}
            onChange={ev => onCollapse ? onCollapse(ev.target.checked) : open(ev.target.checked)}
          />
        )}
        {actions && <Box justify={'end'} gap={'medium'} direction="row" fill>
          {actions}
        </Box>}
      </Box>
      {
        // There is not way to remove the animation from Collapsible at the moment
        collapsibleLabel ?
          <Collapsible open={opened}>{children}</Collapsible> :
          <Box>{children}</Box>
      }

    </Box>
  );
});
