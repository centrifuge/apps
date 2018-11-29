import React from 'react';

import { connect } from 'react-redux';

import Login from './Login';
import { RouteComponentProps, withRouter } from 'react-router';
import { User } from '../../common/models/dto/user';
import { login } from '../../actions/users';

type ConnectedLoginPageProps = {
  login: (user: User) => void;
} & RouteComponentProps;

class ConnectedLoginPage extends React.Component<ConnectedLoginPageProps> {
  login = (user: User) => {
    this.props.login(user);
  };

  render() {
    return <Login onSubmit={this.login} />;
  }
}

export default connect(
  null,
  { login },
)(withRouter(ConnectedLoginPage));
