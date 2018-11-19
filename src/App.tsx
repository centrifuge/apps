import React, { Component } from 'react';
import { Box, Grid, Grommet } from 'grommet';
import { grommet } from 'grommet/themes';
import { BrowserRouter as Router } from 'react-router-dom';

import './App.css';

import Body from './layout/Body';
import Header from './layout/Header';
import SpacedContent from './layout/SpacedContent';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Router>
          <Grommet theme={grommet} full>
            <Grid
              rows={['auto', 'flex']}
              columns={['flex']}
              areas={[
                { name: 'header-container', start: [0, 0], end: [0, 0] },
                { name: 'content-container', start: [0, 1], end: [0, 1] },
              ]}
              fill="true"
            >
              <Box gridArea="header-container">
                <SpacedContent>
                  <Header />
                </SpacedContent>
              </Box>
              <Box gridArea="content-container" background="#f9f9fa">
                <SpacedContent>
                  <Body />
                </SpacedContent>
              </Box>
            </Grid>
          </Grommet>
        </Router>
      </div>
    );
  }
}

export default App;
