import * as React from 'react';
import Tinlake, { Address } from 'tinlake';
import { AuthState, authUser, observeAuthChanges } from '../../ducks/auth';
import { connect } from 'react-redux';

interface Props {
  tinlake: Tinlake;
  auth?: AuthState;
  authUser?: (tinlake: Tinlake, address: Address) => Promise<void>;
  observeAuthChanges?: (tinlake: Tinlake) => Promise<void>;
}

class Auth extends React.Component<Props> {
  componentWillMount() {
    this.init();
  }

  init = async () => {
    const { tinlake, auth, authUser, observeAuthChanges } = this.props;

    if (auth!.state === null) {
      authUser!(tinlake, tinlake.ethConfig.from);
    }

    observeAuthChanges!(tinlake);
  }

  render() {
    return this.props.children;
  }
}

export default connect(state => state, { authUser, observeAuthChanges })(Auth);
