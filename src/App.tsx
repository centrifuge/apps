import React, { Component } from 'react';
import { Box, Grommet } from 'grommet';
import { grommet } from 'grommet/themes';
import { BrowserRouter as Router } from 'react-router-dom';

import Body from './layout/Body';
import Header from './layout/Header';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Router>
          <Grommet theme={grommet} full>
            <Box fill="true" align="center">
              <Header />
              <Body />
            </Box>
          </Grommet>
        </Router>
      </div>
    );
  }
}

export default App;
