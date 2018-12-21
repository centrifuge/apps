import React, { Component } from 'react';
import { Box } from 'grommet';
import { grommet } from 'grommet/themes';
import UIKitTheme from './theme';

import Body from './layout/Body';
import Header from './layout/Header';

class App extends Component {
  render() {
    return (
      <div className="App">
        <UIKitTheme>
          <Box fill align="center">
            <Header />
            <Body />
          </Box>
        </UIKitTheme>
      </div>
    );
  }
}

export default App;
