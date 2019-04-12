import React, { Component } from 'react';
import { Redirect, Route, RouteProps } from 'react-router';
import routes from '../routes';

interface ProtectedRouteProps extends RouteProps{
  authorized: boolean;

}

export class ProtectedRoute extends Component<ProtectedRouteProps> {

  render() {
    const {authorized,...rest} = this.props;
    return authorized ? (
      <Route {...rest}/>
    ) : (
      <Redirect to={routes.index}/>
    );
  }
}

