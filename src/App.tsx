import React, { Component } from 'react';
import { Box } from 'grommet';
import { AxisTheme } from '@centrifuge/axis-theme';

import Routing from './Routing';
import Header from './Header';
import { connect } from 'react-redux';
import { User } from './common/models/user';
import { push, RouterAction } from 'connected-react-router';

interface AppPros {
  selectedRoute: string;
  loggedInUser: User | null;
  push: (route) => RouterAction
}


class App extends Component<AppPros> {
  render() {
    const {
      selectedRoute,
      loggedInUser,
      push,
    } = this.props;
    return (
      <div className="App">
        <AxisTheme>
          <Box fill align="center">
            <Header
              selectedRoute={selectedRoute}
              loggedInUser={loggedInUser}
              push={push}
            />
            <Box
              justify="center"
              direction="row"
              fill
              border="top"
            >
              <Box width="xlarge">
                <Routing loggedInUser={loggedInUser}/>
              </Box>
            </Box>

          </Box>
        </AxisTheme>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    selectedRoute: state.router.location.pathname,
    loggedInUser: state.user.auth.loggedInUser,
  };
};

export default connect(
  mapStateToProps,
  { push },
)(App);
