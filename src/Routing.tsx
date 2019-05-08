import React, { FunctionComponent } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import routes from './routes';
import LoginPage from './user/Login';

interface RouteItem {
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
          {props.routes.map( item => {
              return <Route exact path={item.path} component={item.component}/>
          })}
        <Redirect to={routes.index}/>
      </Switch>
    );
  }
;

Routing.displayName = 'Body';
export default Routing;

