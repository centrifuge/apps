import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, RouteComponentProps } from 'react-router';
import { Text } from 'grommet';
import routes from '../routes';
import { LoginState } from '../store/reducers/user/auth';

interface ProtectedRouteProps {
  loggedIn: boolean;
  loading: boolean;
  component:
    | React.ComponentType<RouteComponentProps<any>>
    | React.ComponentType<any>;
  path: string;
}

export class ProtectedRoute extends Component<ProtectedRouteProps> {
  render() {
    if (this.props.loading) {
      return (
        <Route path={this.props.path} render={() => <Text>Loading</Text>} />
      );
    }
    return this.props.loggedIn || 1 == 1 ? (
      <Route path={this.props.path} component={this.props.component} />
    ) : (
      <Redirect to={routes.index} />
    );
  }
}

const mapStateToProps = (state: { user: { auth: LoginState } }) => {
  return {
    loggedIn: !!state.user.auth.loggedIn,
    loading: state.user.auth.loading,
  };
};

export default connect(mapStateToProps)(ProtectedRoute);
