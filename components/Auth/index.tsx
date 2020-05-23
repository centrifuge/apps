import * as React from 'react';
import { AuthState, loadUser, loadNetwork, observeAuthChanges } from '../../ducks/auth';
import { connect } from 'react-redux';

interface ExtendedAuthState extends AuthState {
}

interface Props {
  tinlake: any;
  render: (auth: ExtendedAuthState) => React.ReactElement | null | false;
  auth?: AuthState;
  loadUser?: (tinlake: any, address: string) => Promise<void>;
  loadNetwork?: (network: string) => Promise<void>;
  observeAuthChanges?: (tinlake: any) => Promise<void>;
}

class Auth extends React.Component<Props> {
  componentDidMount() {
    this.init();
  }

  init = async () => {
    console.log('components/Auth init');

    const { tinlake, loadUser, loadNetwork, observeAuthChanges } = this.props;

    const providerConfig = tinlake?.provider?.publicConfigStore?.getState();
    if (providerConfig) {
      await loadUser!(tinlake, providerConfig.selectedAddress);
      await loadNetwork!(providerConfig.networkVersion);
    } else {
      await loadUser!(tinlake, tinlake.ethConfig.from);
    }

    observeAuthChanges!(tinlake);
  }

  render() {
    const { auth } = this.props;

    return this.props.render(auth!);
  }
}

export default connect(state => state, { loadUser, loadNetwork, observeAuthChanges })(Auth);
