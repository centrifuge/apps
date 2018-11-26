import React, { Component } from 'react';
import { Box, Grommet } from 'grommet';
import { grommet } from 'grommet/themes';
import { ConnectedRouter } from 'connected-react-router';

import Body from './layout/Body';
import Header from './layout/Header';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Grommet theme={grommet} full>
          <Box fill="true" align="center">
            <Header />
            <Body />
          </Box>
        </Grommet>
      </div>
    );
  }
}

export default App;
