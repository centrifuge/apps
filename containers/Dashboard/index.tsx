import * as React from 'react';
import { connect } from 'react-redux';
import { Box, Image, Text, Anchor } from 'grommet';
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
              <Box margin={{ top: 'large', bottom: 'medium' }} direction="row">
                <Box gap="large" style={{ minWidth: 130 }}>
                  <Image src="/static/tinlake-logo.svg" style={{ width: 130 }} />
                </Box>
                <Box margin={{ left: 'medium' }} >
                  <Text>Tinlake is an open market place of asset pools bringing together Asset Originators
                    and Investors that seek to utilize the full potential of Decentralized Finance (DeFi).
                    Asset Originators can responsibly bridge real-world assets into DeFi and access bankless liquidity.
                    Investors can earn attractive yields on different tokenized real-world assets such as invoices, mortgages or streaming royalties.
                    Tinlake’s smart contract platform coordinates the different parties required to structure, administer and finance collateralized pools of these real-world assets.
                    <Anchor margin={{ left: 'xsmall', top: 'small' }} href="https://centrifuge.io/products/tinlake/" target="_blank" label="Learn More" />
                  </Text>
                </Box>
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
