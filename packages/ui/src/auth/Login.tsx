import React, { FunctionComponent, useContext, useState } from 'react';

import LoginForm from './LoginForm';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { User } from '@centrifuge/gateway-lib/models/user';
import routes from '../routes';
import { PERMISSIONS } from '@centrifuge/gateway-lib/utils/constants';
import { AppContext } from '../App';
import { httpClient } from '../http-client';
import TwoFAForm from './TwoFAForm';

type Props = {} & RouteComponentProps;

const LoginPage: FunctionComponent<Props> = props => {
  const [error, setError] = useState<Error>();
  const [loginCandidate, setLoginCandidate] = useState<User>();
  const { user, setUser } = useContext(AppContext);

  const login = async (loginCandidate: User) => {
    try {
      const user = (await httpClient.user.login(loginCandidate)).data;
      setUser(user);
    } catch (e) {
      setError(e);
    }
  };

  const generateToken = async (loginCandidate: User) => {
    try {
      await httpClient.user.generateToken(loginCandidate);
      setLoginCandidate(loginCandidate);
      setError(undefined);
    } catch (e) {
      setError(e);
    }
  };

  // TODO figure out how to do user based redirects
  if (!!user && (loginCandidate || process.env.NODE_ENV === 'development')) {
    if (user.permissions.includes(PERMISSIONS.CAN_MANAGE_USERS)) {
      return <Redirect to={routes.user.index} />;
    }

    if (
      user.permissions.includes(PERMISSIONS.CAN_VIEW_DOCUMENTS) ||
      user.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS)
    ) {
      return <Redirect to={routes.documents.index} />;
    }
  }

  return (
    <>
      {loginCandidate ? (
        <TwoFAForm user={loginCandidate} error={error} onSubmit={login} />
      ) : (
        <LoginForm error={error} onSubmit={generateToken} />
      )}
    </>
  );
};

export default withRouter(LoginPage);
