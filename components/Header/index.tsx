import React from 'react';
import { Box, Button, Image, Text } from 'grommet';
import {
  Menu as MenuIcon,
  User as UserIcon,
  Close as CloseIcon
} from 'grommet-icons';
import { connect } from 'react-redux';
import Link from 'next/link';
import { AuthState, ensureAuthed } from '../../ducks/auth';
import { formatAddress } from '../../utils/formatAddress';
import config from '../../config';
import Router, { withRouter, NextRouter } from 'next/router';
import { NavBar } from '@centrifuge/axis-nav-bar';

const { isDemo } = config;
export interface MenuItem {
  label: string;
  route: string;
  inPool: boolean;
  secondary?: boolean;
  env: string;
}

interface HeaderProps {
  poolTitle?: string;
  selectedRoute: string;
  menuItems: MenuItem[];
  auth?: AuthState;
  router: NextRouter;
  ensureAuthed?: () => Promise<void>;
}

interface State {
  chosenRoute: string;
}

class Header extends React.Component<HeaderProps, State> {
  state: State = {
    chosenRoute: '/'
  };

  connectAccount = async () => {
    try {
      await this.props.ensureAuthed!();
    } catch (e) {
      console.error(`authentication failed with Error ${e}`);
    }
  }

  onRouteClick = (item: MenuItem) => {
    this.setState({ chosenRoute: item.route });
    if (item.route.startsWith('/')) {
      this.pushWithPrefixIfInPool(item);
    } else {
      window.open(item.route);
    }
  }

  pushWithPrefixIfInPool = (item: MenuItem) => {
    if (item.inPool) {
      const { root } = this.props.router.query;
      const route = item.route === '/' ? '' : item.route;
      Router.push(`/[root]${route}`, `/${root}${route}`, { shallow: true });
      return;
    }
    Router.push(item.route, undefined, { shallow: true });
  }

  render() {
    const { poolTitle, selectedRoute, menuItems, auth } = this.props;
    const address = auth?.address;
    const network = auth?.network;

    const itemGap = 'small';
    const logoUrl = (isDemo && '/static/demo_logo.svg') || '/static/logo.svg';

    const theme = {
      navBar: {
        icons: {
          menu: MenuIcon,
          close: CloseIcon,
          user: UserIcon
        }
      }
    };

    const filtMenuItems = menuItems.filter(item =>
      ((isDemo && item.env === 'demo') || item.env === '') && !item.secondary)

    return (
      <Box
        style={{ position: 'sticky', top: 0, height: '56px', zIndex: 2, boxShadow: '0 0 4px 0px #00000075' }}
        background="white"
        justify="center"
        align="center"
        direction="row"
        fill="horizontal"
        pad={{ horizontal: 'small' }}
      >
        <Box direction="row" width="xlarge" align="center">
          <Box align="center" direction="row" basis="full">
            <div style={{ height: 32, paddingRight: 16, borderRight: '1px solid #D8D8D8', display: 'flex',
              alignItems: 'center' }}>
              <Link href="/" shallow><a title="Tinlake" style={{ display: 'block' }}>
                <Image src={logoUrl} style={{ width: 130, verticalAlign: 'middle' }} />
              </a></Link>
            </div>
            {poolTitle &&
              <Box style={{ flex: '0 0 239px', height: 32, padding: '0 16px', borderRight: '1px solid #D8D8D8',
                display: 'flex' }}>
                <div style={{ height: 12, lineHeight: '12px', fontWeight: 500, fontSize: 10, color: '#bbb' }}>
                  Investment Pool</div>
                <div style={{ height: 16, lineHeight: '16px', fontWeight: 500, fontSize: 14, marginTop: 4 }}>
                  {poolTitle}</div>
              </Box>
            }
            <Box flex="grow" basis="auto" style={{ height: 32, padding: '0 16px 0 32px',
              borderRight: '1px solid #D8D8D8' }}>
              {filtMenuItems.length > 0 &&
                <NavBar
                  border={false}
                  itemGap="large"
                  theme={theme}
                  menuItems={filtMenuItems}
                  selectedRoute={selectedRoute}
                  onRouteClick={this.onRouteClick}
                  pad={{ horizontal: 'none' }}
                />
              }
            </Box>
            <div style={{ flex: '0 0 auto', paddingLeft: 16 }}>
              {!address && (
                <Button onClick={this.connectAccount} label="Connect" />
              )}
              {address && (
                <Box direction="column" align="end" basis="full">
                  <Box
                    direction="row"
                    gap={itemGap}
                    align="center"
                    justify="start"
                  >
                    <Text> {formatAddress(address || '')} </Text>
                  </Box>
                  <Box direction="row" justify="start">
                    {network && (
                      <Text
                        style={{
                          color: '#808080',
                          lineHeight: '12px',
                          fontSize: '12px'
                        }}
                      >
                        {' '}
                        Connected to {network}{' '}
                      </Text>
                    )}
                  </Box>
                </Box>
              )}
            </div>
          </Box>
        </Box>
      </Box>
    );
  }
}

export default connect(state => state, { ensureAuthed })(withRouter(Header));
