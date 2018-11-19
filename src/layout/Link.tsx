import React, { FunctionComponent } from 'react';
import { Link as RouterLink, Route } from 'react-router-dom';
import { Text } from 'grommet';

type LinkProps = { label: string; to: string; size?: string };

const Link: FunctionComponent<LinkProps> = ({ label, to, size = 'small' }) => (
  <Route
    path={to}
    children={({ match }) => (
      <RouterLink to={to}>
        <Text size={size}>{label}</Text>
      </RouterLink>
    )}
  />
);

Link.displayName = 'Link';

export default Link;
