import React, { FunctionComponent } from 'react';
import { Link as RouterLink, Route } from 'react-router-dom';
import { Box, Text } from 'grommet';

type LinkProps = { label: string; to: string; size?: string };

const Link: FunctionComponent<LinkProps> = ({
  children,
  label,
  to,
  size = 'small',
}) => (
  <Route
    path={to}
    children={({ match }) => (
      <Box
        height="100%"
        justify="center"
        border={
          match ? { color: 'brand', side: 'bottom', size: 'small' } : false
        }
      >
        <RouterLink to={to}>
          {children ? (
            children
          ) : (
            <Text size={size} weight={match ? 'bold' : 'normal'}>
              {label}
            </Text>
          )}
        </RouterLink>
      </Box>
    )}
  />
);

Link.displayName = 'Link';

export default Link;
