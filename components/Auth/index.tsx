import * as React from 'react';
import Tinlake, { Address } from 'tinlake';
import { AuthState, loadUser, observeAuthChanges } from '../../ducks/auth';
import { connect } from 'react-redux';
import { authTinlake } from '../../services/tinlake';

interface Props {
  tinlake: Tinlake;
  requireAuthentication?: boolean;
  render: (auth: AuthState) => React.ReactElement | null | false;
  auth?: AuthState;
  loadUser?: (tinlake: Tinlake, address: Address) => Promise<void>;
  observeAuthChanges?: (tinlake: Tinlake) => Promise<void>;
}

interface State {
  authedTinlake: boolean;
}

class Auth extends React.Component<Props, State> {
  state = {
    authedTinlake: false,
  };

  componentWillMount() {
    this.init();
  }

  init = async () => {
    const { tinlake, requireAuthentication, auth, loadUser, observeAuthChanges } = this.props;

    if (requireAuthentication) {
      try {
        await authTinlake();
      } catch (e) {}

      this.setState({ authedTinlake: true });
    }

    if (auth!.state === null) {
      await loadUser!(tinlake, tinlake.ethConfig.from);
    }

    observeAuthChanges!(tinlake);
  }

  render() {
    const { auth, requireAuthentication } = this.props;
    const { authedTinlake } = this.state;

    if (requireAuthentication && !authedTinlake) { return null; }

    return this.props.render(auth!);
  }
}

export default connect(state => state, { loadUser, observeAuthChanges })(Auth);
