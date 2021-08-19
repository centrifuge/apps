import { TwoFaType, User } from '@centrifuge/gateway-lib/models/user'
import { Box } from 'grommet'
import { parse } from 'query-string'
import React, { FunctionComponent, useContext, useState } from 'react'
import { RouteComponentProps, withRouter } from 'react-router'
import { AuthContext } from '../auth/Auth'
import { useHttpClient } from '../http-client'
import { goToHomePage } from '../utils/goToHomePage'
import QrCode from './QrCode'
import RegisterForm from './RegisterForm'
import TwoFAForm from './TwoFAForm'

type Props = {
  register: (user: User) => void
  isRegistering: boolean
  hasRegistered: boolean
} & RouteComponentProps

const Register: FunctionComponent<Props> = (props: Props) => {
  const httpClient = useHttpClient()
  const queryParams = parse(props.location.search, { decode: true })
  const email: string = queryParams.email
    ? Array.isArray(queryParams.email)
      ? queryParams.email[0]
      : (queryParams.email as string)
    : ''

  const [user, setUser] = useState<User>()
  const [error, setError] = useState<Error>()
  const loggedInUser = useContext(AuthContext).user

  const login = async (loginCandidate: User) => {
    try {
      await httpClient.user.login({
        email: loginCandidate.email,
        password: loginCandidate.password || '',
        token: loginCandidate.token,
      })
      goToHomePage()
    } catch (e) {
      setError(e)
    }
  }
  const register = async (registerCandidate: User) => {
    try {
      const registeredUser = (await httpClient.user.register(registerCandidate)).data
      setUser({
        ...registeredUser,
        ...registerCandidate,
      })
    } catch (e) {
      setError(e)
      console.log('Failed to register', e)
    }
  }

  if (loggedInUser) {
    goToHomePage()
    return <></>
  }
  return (
    <Box align="center" justify="center">
      <Box width="medium" background="white" border="all" margin="medium" pad="medium">
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
  )
}

export default withRouter(Register)
