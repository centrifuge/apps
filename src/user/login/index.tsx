import React from 'react';

import { connect } from 'react-redux';

import Login from './Login';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { User } from '../../common/models/user';
import { login } from '../../actions/users';
import routes from '../../routes';
import { LoginState } from '../../reducers/user/auth';

type ConnectedLoginPageProps = {
  login: (user: User) => void;
  loggedIn: boolean;
} & RouteComponentProps;

class ConnectedLoginPage extends React.Component<ConnectedLoginPageProps> {
  login = (user: User) => {
    this.props.login(user);
  };

  render() {
    return this.props.loggedIn ? (
      <Redirect to={routes.invoices.index} />
    ) : (
      <Login onSubmit={this.login} />
    );
  }
}

const mapStateToProps = (state: { user: { auth: LoginState } }) => {
  return {
    loggedIn: !!state.user.auth.loggedIn,
  };
};

export default connect(
  mapStateToProps,
  { login },
)(withRouter(ConnectedLoginPage));
