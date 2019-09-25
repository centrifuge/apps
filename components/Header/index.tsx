import React from 'react';
import { Box, Button, Image, Text } from 'grommet';
import { connect } from 'react-redux';
import Link from 'next/link';
import { AuthState } from '../../ducks/auth';
import Badge from '../Badge';
import { formatAddress } from '../../utils/formatAddress';
import config from '../../config'

const { isDemo } = config
export interface MenuItem {
  label: string;
  route: string;
  secondary?: boolean;
  permission?: "admin" | "borrower" | "demo" 
}

interface HeaderProps {
  selectedRoute: string;
  menuItems: MenuItem[];
  auth?: AuthState;
}

class Header extends React.Component<HeaderProps> {

  render() {
    const { selectedRoute, menuItems, auth } = this.props;
    const address = auth && auth.user && auth.user.address;
    const isAdmin = auth && auth.user && auth.user.isAdmin;
    const network = auth && auth.network;

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

        {menuItems.filter(item => 
        {
          return (
            (isDemo || isAdmin) && item.permission === "admin" ||
            (isDemo || !isAdmin) && item.permission === 'borrower' ||
            isDemo && item.permission === "demo" ||
            !item.permission) 
            && !item.secondary
        }
        )
        .map((item) => {
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
       { isAdmin &&  <Badge text={'Admin'} style={{  }} /> }
       </Box>
      <Box direction="column">
        <Box direction="row" gap={itemGap} align="center" justify="start">
          <Text> { formatAddress(address || '') } </Text>
        </Box>
        <Box direction="row" justify="start" >
          { network && <Text  style={{ color: '#808080' , lineHeight: '12px', fontSize: '12px' }}> Connected to {network} </Text> }
        </Box>
      </Box>
    </Box>
  </Box>;
  }
}

export default connect(state => state)(Header);
