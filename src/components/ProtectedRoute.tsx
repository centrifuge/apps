import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RequestState } from '../reducers/http-request-reducer';
import { Redirect, Route, RouteComponentProps } from 'react-router';
import { Text } from 'grommet';
import routes from '../routes';

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

const mapStateToProps = (state: { users: { login: RequestState<string> } }) => {
  return {
    loggedIn: !!state.users.login.data,
    loading: state.users.login.loading,
  };
};

export default connect(mapStateToProps)(ProtectedRoute);
