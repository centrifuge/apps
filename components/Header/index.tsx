import React from 'react';
import { Box, Button, Image, Text } from 'grommet';
import { connect } from 'react-redux';
import Link from 'next/link';
import { AuthState } from '../../ducks/auth';
import Badge from '../Badge';
import { formatAddress } from '../../utils/formatAddress';
import config from '../../config'
import { authTinlake } from '../../services/tinlake';

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

  connectAccount = async () => {
    try {
      await authTinlake();
    } catch (e) {
      console.log(`authentication failed with Error ${e}`)
    }
  }
  render() {
    const { selectedRoute, menuItems, auth } = this.props;
    const user = auth && auth.user
    const address = user && user.address;
    const isAdmin = user && user.isAdmin;
    const network = auth && auth.network;

    const sectionGap = 'medium';
    const itemGap = 'small';
    const logoUrl = isDemo && "/static/demo_logo.svg" || "/static/logo.svg";

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
        <a title="Tinlake"><Image src={logoUrl} style={{ width: 130 }} /></a>
      </Link>
      <Box direction="row" gap={itemGap} margin={{ right: 'auto' }}>

        {menuItems.filter(item => 
        {
          return (
            (user && isDemo ) ||
            (user && isAdmin) && item.permission === "admin" ||
            (user && !isAdmin) && item.permission === 'borrower' ||
            !item.permission
            ) 
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
      { !user && <Button onClick={this.connectAccount} label="Connect" /> }
      { user && 
        <Box direction="row" gap={itemGap} align="center" justify="end">
        { isAdmin &&  <Badge text={'Admin'} style={{  }} /> }
        </Box> 
      }
      { user && 
        <Box direction="column">
          <Box direction="row" gap={itemGap} align="center" justify="start">
            <Text> { formatAddress(address || '') } </Text>
          </Box>
          <Box direction="row" justify="start" >
            { network && <Text  style={{ color: '#808080' , lineHeight: '12px', fontSize: '12px' }}> Connected to {network} </Text> }
          </Box>
        </Box>
      }
    
    </Box>
  </Box>;
  }
}

export default connect(state => state)(Header);
