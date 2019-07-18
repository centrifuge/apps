import * as React from 'react';
import Tinlake, { Address } from 'tinlake';
import { AuthState, loadUser, observeAuthChanges } from '../../ducks/auth';
import { connect } from 'react-redux';
import { authTinlake } from '../../services/tinlake';

interface ExtendedAuthState extends AuthState {
  isAdmin: boolean;
  isAuthenticated: boolean;
  isAuthorized: boolean;
}

interface Props {
  tinlake: Tinlake;
  waitForAuthentication?: boolean;
  waitForAuthorization?: boolean;
  render: (auth: ExtendedAuthState) => React.ReactElement | null | false;
  auth?: AuthState;
  loadUser?: (tinlake: Tinlake, address: Address) => Promise<void>;
  observeAuthChanges?: (tinlake: Tinlake) => Promise<void>;
}

interface State {
  isAuthenticating: boolean;
}

class Auth extends React.Component<Props, State> {
  state = {
    isAuthenticating: true,
  };
  isMounted = false;

  componentWillMount() {
    this.init();
  }

  componentDidMount() {
    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  init = async () => {
    const { tinlake, waitForAuthentication, auth, loadUser, observeAuthChanges } = this.props;

    if (waitForAuthentication) {
      try {
        await authTinlake();
      } catch (e) {}

      if (this.isMounted) {
        this.setState({ isAuthenticating: false });
      }
    }

    if (auth!.state === null) {
      await loadUser!(tinlake, tinlake.ethConfig.from);
    }

    observeAuthChanges!(tinlake);
  }

  render() {
    const { auth, waitForAuthentication, waitForAuthorization } = this.props;
    const { isAuthenticating } = this.state;

    const isAuthorizing = auth!.state !== 'loaded';

    if (waitForAuthentication && isAuthenticating) { return null; }
    if (waitForAuthorization && isAuthorizing) { return null; }

    const extendedAuthState: ExtendedAuthState = {
      ...auth!,
      isAuthenticated: !isAuthenticating,
      isAuthorized: !isAuthorizing,
      isAdmin: !!auth!.user && auth!.user.isAdmin,
    };

    return this.props.render(extendedAuthState);
  }
}

export default connect(state => state, { loadUser, observeAuthChanges })(Auth);
