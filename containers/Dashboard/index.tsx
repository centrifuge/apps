import * as React from 'react';
import { connect } from 'react-redux';
import { Box, Heading } from 'grommet';
import SecondaryHeader from '../../components/SecondaryHeader';

interface Props {}

class Dashboard extends React.Component<Props> {
  render() {
    return (
      <Box>
        <SecondaryHeader>
          <Heading level="3">Dashboard</Heading>
        </SecondaryHeader>
        <Box pad={{ vertical: 'medium' }}></Box>
      </Box>
    );
  }
}

export default connect(state => state, {})(Dashboard);
