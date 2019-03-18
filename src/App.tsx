import React, {Component} from 'react';
import {Box} from 'grommet';
import {AxisTheme} from '@centrifuge/axis-theme';

import Body from './layout/Body';
import Header from './layout/Header';

class App extends Component {
  render() {
    return (
      <div className="App">
        <AxisTheme>
          <Box fill align="center">
            <Header />
            <Body />
          </Box>
        </AxisTheme>
      </div>
    );
  }
}

export default App;
