import React, { FunctionComponent, useContext } from 'react';

import RegisterForm from './RegisterForm';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { User } from '@centrifuge/gateway-lib/models/user';
import { AppContext } from '../App';
import { httpClient } from '../http-client';
import { parse } from 'query-string';
type Props = {
  register: (user: User) => void;
  isRegistering: boolean;
  hasRegistered: boolean;
} & RouteComponentProps;

const Register: FunctionComponent<Props> = (props: Props) => {

  const queryParams = parse(props.location.search,{decode:true});
  const email: string = queryParams.email
    ? Array.isArray(queryParams.email)
      ? queryParams.email[0]
      : (queryParams.email as string)
    : '';
  const { user, setUser } = useContext(AppContext);
  const register = async (registerCandidate: User) => {
    try {
      await httpClient.user.register(registerCandidate);
      const user = (await httpClient.user.login(registerCandidate)).data;
      setUser(user);
    } catch (e) {
      console.log('Failed to register', e);
    }
  };

  if (user) {
    return <Redirect to={'/'} />;
  }
  return <RegisterForm email={email} onSubmit={register} />;
};

export default withRouter(Register);

// ttt@centrifuge.io
// test@centrifuge.io
