import { AgreementMap } from '@centrifuge/onboarding-api/src/controllers/user.controller'
import * as React from 'react'
import styled from 'styled-components'
import Header from '../components/Header'
import UserBoard from '../containers/UserBoard'

interface Props {
  onboardingApiHost: string
}

const App: React.FC<Props> = (props: Props) => {
  // TODO: move this into a duck
  const [agreementMap, setAgreementMap] = React.useState({} as AgreementMap)

  React.useEffect(() => {
    async function fetchUsers() {
      const res = await fetch(`${props.onboardingApiHost}users/0x4B6CA198d257D755A5275648D471FE09931b764A`)
      const body = await res.json()
      setAgreementMap(body)
      console.log(body)
    }

    fetchUsers()
  }, [])

  return (
    <Wrapper>
      <Header onboardingApiHost={props.onboardingApiHost} />
      <UserBoard users={agreementMap} onboardingApiHost={props.onboardingApiHost} />
    </Wrapper>
  )
}

export async function getStaticProps() {
  return {
    props: {
      onboardingApiHost: process.env.ONBOARDING_API_HOST,
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
