import React, { FunctionComponent } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import routes from './routes';
import LoginPage from './auth/Login';
import RegisterPage from './auth/Register';

export interface RouteItem {
  path: string,
  component: any
}

interface RoutingProps {
  routes: RouteItem[]
}

const Routing: FunctionComponent<RoutingProps> = (props) => {
    return (
      <Switch>
        <Route exact path={routes.index} component={LoginPage}/>
        <Route exact path={routes.user.register} component={RegisterPage}/>
          {props.routes.map( (item, index) => {
              return <Route key={index} exact path={item.path} component={item.component}/>
          })}
        <Redirect to={routes.index}/>
      </Switch>
    );
  }
;

Routing.displayName = 'Body';
export default Routing;

