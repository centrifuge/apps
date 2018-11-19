import React, { Component } from 'react';
import { Grid, Grommet } from 'grommet';
import { grommet } from 'grommet/themes';
import './App.css';
import Header from './Header';
import Body from './Body';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Grommet theme={grommet} full>
          <Grid
            rows={['auto', 'flex']}
            columns={['flex']}
            areas={[
              { name: 'header', start: [0, 0], end: [0, 0] },
              { name: 'main', start: [0, 1], end: [0, 1] },
            ]}
            fill
          >
            <Header />
            <Body />
          </Grid>
        </Grommet>
      </div>
    );
  }
}

export default App;
