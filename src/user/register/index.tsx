import React from 'react';

import { Text } from 'grommet';
import { connect } from 'react-redux';

import Register from './Register';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { User } from '../../common/models/user';
import { register } from '../../actions/users';
import { RequestState } from '../../reducers/http-request-reducer';
import routes from '../../routes';

type ConnectedRegisterPageProps = {
  register: (user: User) => void;
  isRegistering: boolean;
  hasRegistered: boolean;
} & RouteComponentProps;

class ConnectedRegisterPage extends React.Component<
  ConnectedRegisterPageProps
> {
  render() {
    if (this.props.isRegistering) {
      return <Text>Loading</Text>;
    }

    if (this.props.hasRegistered) {
      return <Redirect to={routes.index} />;
    }

    return <Register onSubmit={this.props.register} />;
  }
}

const mapStateToProps = (state: { user: { register: RequestState<User> } }) => {
  return {
    isRegistering: state.user.register.loading,
    hasRegistered: !!state.user.register.data,
  };
};

export default connect(
  mapStateToProps,
  { register },
)(withRouter(ConnectedRegisterPage));
