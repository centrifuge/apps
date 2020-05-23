import * as React from 'react';
import { getTinlake } from '../../services/tinlake';

interface Props {
  render: (tinlake: any) => React.ReactElement;
  addresses?: {
    'ROOT_CONTRACT': string,
    'ACTIONS': string,
    'PROXY_REGISTRY': string,
    'COLLATERAL_NFT': string
  };
  contractConfig?: {
    'JUNIOR_OPERATOR': 'ALLOWANCE_OPERATOR',
    'SENIOR_OPERATOR': 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  };
}

interface State {
  loading: boolean;
}

class WithTinlake extends React.Component<Props, State> {
  state: State = { loading: true };
  tinlake: any |null = null;
  isMounted = false;
  componentDidMount() {
    this.init();
    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  init = async () => {
    console.log('components/WithTinlake init');

    const { addresses, contractConfig } = this.props;

    this.tinlake = await getTinlake({ addresses, contractConfig });
    if (this.isMounted) {
      this.setState({ loading: false });
    }
  }

  render() {
    if (this.state.loading || !this.tinlake) { return null; }
    return this.props.render(this.tinlake);
  }
}

export default WithTinlake;
