import React from 'react';
import { Box, Button, Image, Text, Anchor, ResponsiveContext } from 'grommet';
import { Menu as MenuIcon, User as UserIcon, Close as CloseIcon } from 'grommet-icons';
import { connect } from 'react-redux';
import Link from 'next/link';
import { AuthState } from '../../ducks/auth';
import { formatAddress } from '../../utils/formatAddress';
import config from '../../config';
import { authTinlake } from '../../services/tinlake';
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
      await authTinlake();
    } catch (e) {
      console.log(`authentication failed with Error ${e}`);
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
      Router.push(`/[root]${route}`, `/${root}${route}`);
      return;
    }
    Router.push(item.route);
  }

  render() {
    const { poolTitle, selectedRoute, menuItems, auth } = this.props;
    const address = auth?.address;
    const network = auth?.network;

    const itemGap = 'small';
    const logoUrl = isDemo && '/static/demo_logo.svg' || '/static/logo.svg';

    const theme = {
      navBar: {
        icons: {
          menu: MenuIcon,
          close: CloseIcon,
          user: UserIcon
        }
      }
    };

    return <Box
      style={{ position: 'sticky', top: 0, height: '90px', zIndex: 1 }}
      background="white"
      border={{ side: 'bottom', color: 'light-4' }}
      justify="center"
      align="center"
      direction="row"
      fill="horizontal"
      pad={{ horizontal: 'small' }}
    >
      <ResponsiveContext.Consumer>{size => size === 'large' ? (

        <Box direction="row" width="xlarge" align="center" >
          <Box align="center" direction="row" basis="full" >
            <Link href="/">
              <a title="Tinlake"><Image src={logoUrl} style={{ width: 130 }} /></a>
            </Link>
            <Box margin={{ left: '80px', right: '56px' }} flex="grow" basis="auto"
              style={{ fontSize: 16, fontWeight: 500 }}>{poolTitle}</Box>
            <Box flex="grow" basis="auto">
              <NavBar
                border={false}
                theme={theme}
                menuItems={menuItems.filter((item) => {
                  return (
                    (isDemo && item.env === 'demo' || item.env === '')
                    && !item.secondary
                  );
                }
                )}
                overlayWidth="100vw"
                selectedRoute={selectedRoute}
                onRouteClick={this.onRouteClick}
              />
            </Box>
          </Box>
          <Box direction="row" basis="full">
            {!address &&
              <Box direction="column" align="end" basis="full" alignSelf="center">
                <Button onClick={this.connectAccount} label="Connect" />
              </Box>
            }
            {address &&
              <Box direction="column" align="end" basis="full">
                <Box direction="row" gap={itemGap} align="center" justify="start">
                  <Text> {formatAddress(address || '')} </Text>
                </Box>
                <Box direction="row" justify="start" >
                  {network && <Text style={{ color: '#808080', lineHeight: '12px', fontSize: '12px' }}> Connected to {network} </Text>}
                </Box>
              </Box>
            }
            {isDemo &&
              <Box pad={{ left: 'small' }} alignSelf="center"> <Anchor href="https://centrifuge.hackmd.io/zRnaoPqfS7mTm9XL0dDRtQ?view" target="_blank" label="Help" style={{ textDecoration: 'none', fontWeight: 900 }} /> </Box>
            }</Box>
        </Box>
      )
        : (
          <Box direction="row" width="xlarge" align="center">
            <Box align="center" direction="row" basis="full" >
              <Link href="/">
                <a title="Tinlake"><Image src={logoUrl} style={{ width: 130 }} /></a>
              </Link>
            </Box>
            <Box flex="grow" basis="auto" style={{ fontSize: 16, fontWeight: 500 }}>{poolTitle}</Box>
            <Box direction="row" basis="full" >
            {!address &&
              <Box direction="column" align="end" basis="full" alignSelf="center">
                <Button onClick={this.connectAccount} label="Connect" />
              </Box>
            }
            {address &&
            <Box direction="column" align="end" basis="full" alignSelf="center">
              <Box direction="row" gap={itemGap} align="center" justify="start">
                <Text> {formatAddress(address || '')} </Text>
              </Box>
              <Box direction="row" justify="start" >
                {network && <Text style={{ color: '#808080', lineHeight: '12px', fontSize: '12px' }}> Connected to {network} </Text>}
              </Box>
            </Box>
            }
            {isDemo &&
              <Box margin={{ horizontal: 'small' }} alignSelf="center"> <Anchor href="https://centrifuge.hackmd.io/zRnaoPqfS7mTm9XL0dDRtQ?view" target="_blank" label="Help" style={{ textDecoration: 'none', fontWeight: 900 }} /> </Box>
            }

              <Box fill={false}>
                <NavBar
                  border={false}
                  theme={theme}
                  menuItems={menuItems.filter((item) => {
                    return (
                      (isDemo && item.env === 'demo' || item.env === '')
                      && !item.secondary
                    );
                  }
                  )}
                  overlayWidth="100vw"
                  selectedRoute={selectedRoute}
                  onRouteClick={this.onRouteClick}
                />
              </Box>
            </Box>

          </Box>
        )}</ResponsiveContext.Consumer> </Box>;
  }
}

export default connect(state => state)(withRouter(Header));
