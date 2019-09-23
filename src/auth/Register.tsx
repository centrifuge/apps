import React, { FunctionComponent, useContext } from 'react';

import RegisterForm from './RegisterForm';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { User } from '../common/models/user';
import { AppContext } from '../App';
import { httpClient } from '../http-client';

type Props = {
  register: (user: User) => void;
  isRegistering: boolean;
  hasRegistered: boolean;
} & RouteComponentProps;

const Register: FunctionComponent<Props> = (props: Props) => {

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
    return <Redirect to={'/'}/>;
  }
  return <RegisterForm onSubmit={register}/>;

};


export default withRouter(Register);


// ttt@centrifuge.io
// test@centrifuge.io
