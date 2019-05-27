import React from 'react';

import {connect} from 'react-redux';

import LoginForm from './LoginForm';
import {Redirect, RouteComponentProps, withRouter} from 'react-router';
import {User} from '../common/models/user';
import {login} from '../store/actions/users';
import routes from '../routes';
import {LoginState} from '../store/reducers/user/auth';
import {PERMISSIONS} from "../common/constants";

type ConnectedLoginPageProps = {
  login: (user: User) => void;
  loggedInUser: User |  null;
} & RouteComponentProps;

class ConnectedLoginPage extends React.Component<ConnectedLoginPageProps> {
  login = (user: User) => {
    this.props.login(user);
  };

  render() {

    if (!!this.props.loggedInUser) {
      switch (this.props.loggedInUser.permissions[0]) {
        case PERMISSIONS.CAN_CREATE_INVOICES: {
          return <Redirect to={routes.invoices.index} />
        }
        case PERMISSIONS.CAN_FUND_INVOICES: {
           return <Redirect to={routes.funding.index} />
        }
        case PERMISSIONS.CAN_MANAGE_USERS: {
          return <Redirect to={routes.user.index} />
        }
      }
    } else {
      return (
          <LoginForm onSubmit={this.login} />
      )
    }
  }
}

const mapStateToProps = (state: { user: { auth: LoginState } }) => {
  return {
    loggedInUser: state.user.auth.loggedInUser,
  };
};

export default connect(
  mapStateToProps,
  { login },
)(withRouter(ConnectedLoginPage));
