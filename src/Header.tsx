import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Box, Button, Image, Text } from 'grommet';
import logo from './logo.png';
import { User } from './common/models/user';
import { DisplayField } from './components/DisplayField';


export interface MenuItem {
  label: string,
  route: string,
  external?: boolean,
  secondary?: boolean
}

interface HeaderProps {
  user: User | null,
  selectedRoute: string,
  menuItems: MenuItem[],
  push: (route: string) => void
}

//TODO move this to components and make more generic
const Header: FunctionComponent<HeaderProps> = (props) => {

  const { selectedRoute, menuItems, push, user } = props;

  const sectionGap = 'medium';
  const itemGap = 'small';

  return <Box
    justify="center"
    align="center"
    height="xsmall"
    fill="horizontal"
    // TODO move this to axis theme
    style={{ position: 'sticky', top: 0, height: '90px',zIndex:1 }}
    background='white'
    border={{ side: 'bottom', color: 'light-4' }}
  >
    <Box
      direction="row"
      fill="vertical"
      align="center"
      justify="between"
      pad={{ horizontal: 'medium' }}
      gap={sectionGap}
      width='xlarge'
    >
      <Link label="Centrifuge" to="/" size="large">
        <Image src={logo}/>
      </Link>
      <Box direction="row" gap={itemGap}>

        {menuItems.filter(item => !item.secondary).map((item) => {
            const anchorProps = {
              ...(item.external ? { href: item.route } : { onClick: () => push(item.route) }),
              ...(selectedRoute === item.route ? { color: 'selected' } : {}),
            };
            return <Button
              plain
              key={item.label}
              label={item.label}
              {...anchorProps}
            />;
          },
        )}
      </Box>
      {user && <Box direction="row" gap={itemGap} align="center" justify="end">
        <Box direction="row" align="center" gap={'xsmall'}>
          <Text>Centrifuge ID: </Text>
          <DisplayField width={'160px'} noBorder={true} value={user.account}/>
        </Box>
        <Text> {user.email}</Text>
      </Box>}
      <Box direction="row" gap={itemGap} align="center" justify="end">

        {menuItems.filter(item => item.secondary).map((item) => {
            const anchorProps = {
              ...(item.external ? { href: item.route } : { onClick: () => push(item.route) }),
              ...(selectedRoute === item.route ? { className: 'selected' } : {}),
            };
            return <Anchor
              key={item.label}
              label={item.label}
              {...anchorProps}
            />;
          },
        )}
      </Box>
    </Box>
  </Box>;
};

Header.displayName = 'Header';

export default Header;
