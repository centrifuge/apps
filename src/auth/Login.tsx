import React, { FunctionComponent, useContext, useState } from 'react';

import LoginForm from './LoginForm';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { User } from '../common/models/user';
import routes from '../routes';
import { PERMISSIONS } from '../common/constants';
import { AppContext } from '../App';
import { httpClient } from '../http-client';

type Props = {} & RouteComponentProps;

const ConnectedLoginPage: FunctionComponent<Props> = (props) => {

  const [error, setError] = useState<Error>();
  const { user, setUser } = useContext(AppContext);

  const login = async (loginCandidate: User) => {
    try {
      const user = (await httpClient.user.login(loginCandidate)).data;
      setUser(user);
    } catch (e) {
      setError(e);
    }
  };

  // TODO figure out how to do user based redirects
  if (!!user) {

    if (user.permissions.includes(PERMISSIONS.CAN_MANAGE_USERS)) {
      return <Redirect to={routes.user.index}/>;
    }

    if (user.permissions.includes(PERMISSIONS.CAN_VIEW_DOCUMENTS) ||
      user.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS)) {
      return <Redirect to={routes.documents.index}/>;
    }
  }

  return (
    <LoginForm error={error} onSubmit={login}/>
  );
};


export default withRouter(ConnectedLoginPage);
