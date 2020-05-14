import * as React from 'react';
import { connect } from 'react-redux';
import {Box, Text} from 'grommet';
import { Spinner } from '@centrifuge/axis-spinner';
import { loadPools, PoolsState } from '../../ducks/pools';
import PoolList from '../../components/PoolList';
import PoolsMetrics from '../../components/PoolsMetrics';

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
        {!pools || pools.state === 'loading' ? (
          <Spinner
            height={'calc(100vh - 89px - 84px)'}
            message={'Loading...'}
          />
        ) : (
          pools.data &&
            <Box basis={'full'}>
              <Box margin="large">
                <Text alignSelf="center">
                  Text Placeholder
                </Text>
              </Box>
              <Box direction="row" gap="large" margin={{ bottom: 'medium' }} justify="evenly">
                <PoolsMetrics pools={pools.data}/>
              </Box>
              <PoolList pools={pools.data.pools}/>
            </Box>
        )}
        <Box pad={{ vertical: 'medium' }}></Box>
      </Box>
    );
  }
}

export default connect(state => state, { loadPools })(Dashboard);
