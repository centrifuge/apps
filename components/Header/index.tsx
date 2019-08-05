import React, { FunctionComponent } from 'react';
import { Box, Button, Image, Text } from 'grommet';
import Link from 'next/link';

export interface MenuItem {
  label: string;
  route: string;
  secondary?: boolean;
}

interface HeaderProps {
  selectedRoute: string;
  menuItems: MenuItem[];
  section: string;
}

const Header: FunctionComponent<HeaderProps> = (props) => {
  const { selectedRoute, menuItems, section } = props;

  const sectionGap = 'medium';
  const itemGap = 'small';

  return <Box
    justify="center"
    align="center"
    height="xsmall"
    fill="horizontal"
    style={{ position: 'sticky', top: 0, height: '90px', zIndex: 1 }}
    background="white"
    border={{ side: 'bottom', color: 'light-4' }}
  >
    <Box
      direction="row"
      fill="vertical"
      align="center"
      justify="between"
      pad={{ horizontal: 'medium' }}
      gap={sectionGap}
      width="xlarge"
    >
      <Link href="/">
        <a title="Tinlake"><Image src="/static/logo.svg" style={{ width: 130 }} /></a>
      </Link>
      <Box direction="row" gap={itemGap} margin={{ right: 'auto' }}>

        {menuItems.filter(item => !item.secondary).map((item) => {
          const anchorProps = {
            ...(item.route === selectedRoute ?
              { className: 'selected', color: '#0828BE' } : {}),
          };
          return <Link href={item.route} key={item.label}><Button
            plain
            label={item.label}
            {...anchorProps}
          /></Link>;
        },
        )}
      </Box>
      <Box direction="row" gap={itemGap} align="center" justify="end">
        <Text>{section}</Text>
      </Box>
    </Box>
  </Box>;
};

Header.displayName = 'Header';

export default Header;
