import React, { Component } from 'react';
import { Box } from 'grommet';
import { AxisTheme } from '@centrifuge/axis-theme';

import Routing from './Routing';
import Header from './Header';

class App extends Component {
  render() {
    return (
      <div className="App">
        <AxisTheme>
          <Box fill align="center">
            <Header/>
            <Box
              justify="center"
              direction="row"
              fill
              border="top"
            >
              <Box width="xlarge">
                <Routing/>
              </Box>
            </Box>

          </Box>
        </AxisTheme>
      </div>
    );
  }
}

export default App;
