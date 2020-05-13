import * as React from 'react';
import { connect } from 'react-redux';
import { Box, Heading } from 'grommet';
import SecondaryHeader from '../../components/SecondaryHeader';
import { Spinner } from '@centrifuge/axis-spinner';
import { loadPools, PoolsState } from '../../ducks/pools';

interface Props {
  loadPools?: () => Promise<void>;
  pools?: PoolsState;
}

class Dashboard extends React.Component<Props> {
  componentDidMount() {
    const { loadPools } = this.props;
    loadPools && loadPools();
  }

  render() {
    const { pools } = this.props;

    return (
      <Box>
        <SecondaryHeader>
          <Heading level="3">Dashboard</Heading>
        </SecondaryHeader>

        {!pools || pools.state === 'loading' ? (
          <Spinner
            height={'calc(100vh - 89px - 84px)'}
            message={'Loading...'}
          />
        ) : (
          <div>{JSON.stringify(pools.data)}</div>
        )}

        <Box pad={{ vertical: 'medium' }}></Box>
      </Box>
    );
  }
}

export default connect(state => state, { loadPools })(Dashboard);
