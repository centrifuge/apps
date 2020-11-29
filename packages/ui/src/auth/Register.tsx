import React, { FunctionComponent, useContext, useState } from 'react';

import RegisterForm from './RegisterForm';
import { RouteComponentProps, withRouter } from 'react-router';
import { TwoFaType, User } from '@centrifuge/gateway-lib/models/user';
import { httpClient } from '../http-client';
import { parse } from 'query-string';
import QrCode from './QrCode';
import TwoFAForm from './TwoFAForm';
import { AppContext } from '../App';
import routes from '../routes';
import { Box } from 'grommet';
type Props = {
  register: (user: User) => void;
  isRegistering: boolean;
  hasRegistered: boolean;
} & RouteComponentProps;

const Register: FunctionComponent<Props> = (props: Props) => {
  const queryParams = parse(props.location.search, { decode: true });
  const email: string = queryParams.email
    ? Array.isArray(queryParams.email)
      ? queryParams.email[0]
      : (queryParams.email as string)
    : '';

  const [user, setUser] = useState<User>();
  const [error, setError] = useState<Error>();
  const loggedInUser = useContext(AppContext).user;

  const goToHomePage = () => {
    window.location.href = routes.index;
  };

  const login = async (loginCandidate: User) => {
    try {
      await httpClient.user.login(loginCandidate);
      goToHomePage();
    } catch (e) {
      setError(e);
    }
  };
  const register = async (registerCandidate: User) => {
    try {
      const registeredUser = (await httpClient.user.register(registerCandidate))
        .data;
      setUser({
        ...registeredUser,
        ...registerCandidate,
      });
    } catch (e) {
      setError(e);
      console.log('Failed to register', e);
    }
  };

  if (loggedInUser) {
    goToHomePage();
    return <></>;
  }
  return (
    <Box align="center" justify="center">
      <Box
        width="medium"
        background="white"
        border="all"
        margin="medium"
        pad="medium"
      >
        {user ? (
          user.twoFAType === TwoFaType.APP ? (
            <QrCode user={user!} error={error} onSubmit={login} />
          ) : (
            <TwoFAForm user={user!} error={error} onSubmit={login} />
          )
        ) : (
          <RegisterForm email={email} onSubmit={register} error={error} />
        )}
      </Box>
    </Box>
  );
};

export default withRouter(Register);
