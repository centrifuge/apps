import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import Header from '../components/Header'
import UserBoard from '../containers/UserBoard'
import { UsersState } from '../ducks/users'

interface Props {
  onboardingApiHost: string
  etherscanUrl: string
}

const App: React.FC<Props> = (props: Props) => {
  const users = useSelector((state: { users: UsersState }) => state.users.data)

  return (
    <Wrapper>
      <Header onboardingApiHost={props.onboardingApiHost} />
      {users && (
        <UserBoard onboardingApiHost={props.onboardingApiHost} etherscanUrl={props.etherscanUrl} users={users} />
      )}
    </Wrapper>
  )
}

export async function getStaticProps() {
  return {
    props: {
      onboardingApiHost: process.env.ONBOARDING_API_HOST,
      etherscanUrl: process.env.ETHERSCAN_URL,
    },
  }
}

const Wrapper = styled.div`
  background: #f9f9f9;
  height: 100%;
  width: 100%;
  margin: 0;
`

export default App
