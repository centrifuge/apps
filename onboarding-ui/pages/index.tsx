import { Box } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import Header from '../components/Header'
import { AgreementMap } from '../types/agreement'

interface Props {
  onboardingApiHost: string
}

const App: React.FC<Props> = (props: Props) => {
  const [agreementMap, setAgreementMap] = React.useState({} as AgreementMap)

  React.useEffect(() => {
    async function fetchUsers() {
      const res = await fetch(`${props.onboardingApiHost}users/6967de7a-ef9f-4c81-97ad-e5c86a9606e9`)
      const body = await res.json()
      setAgreementMap(body)
      console.log(body)
    }

    fetchUsers()
  }, [])

  return (
    <Wrapper>
      <Header />

      <Content>
        <Columns>
          {Object.keys(agreementMap).map((col: string) => (
            <Column key={col}>
              <ColumnTitle>{col}</ColumnTitle>
              <Cards>
                {agreementMap[col].map(({ user }) => (
                  <Card
                    key={user.id}
                    pad="medium"
                    elevation="small"
                    round="xsmall"
                    margin={{ bottom: 'medium' }}
                    background="white"
                  >
                    <InvestorName>{user.entityName || user.fullName}</InvestorName>
                    <Flag>
                      <img src={`https://www.countryflags.io/${user.countryCode}/flat/24.png`} alt="" />
                    </Flag>
                  </Card>
                ))}
              </Cards>
            </Column>
          ))}
        </Columns>
      </Content>
    </Wrapper>
  )
}

export async function getStaticProps() {
  return {
    props: {
      onboardingApiHost: process.env.ONBOARDING_API_HOST,
    }, // will be passed to the page component as props
  }
}

const Wrapper = styled.div`
  background: #f9f9f9;
  height: 100%;
  width: 100%;
  margin: 0;
`

const Content = styled.div`
  margin: 40px;
  text-align: center;
`

const Columns = styled.div`
  display: inline-flex;
  margin: 0 auto;
`

const Column = styled.div`
  width: 260px;
  margin: 0 20px 0 0;
`

const ColumnTitle = styled.div`
  color: #777777;
  margin: 0 0 20px 20px;
  font-weight: bold;
  font-size: 14px;
  text-align: left;
`

const Cards = styled.div``

const Card = styled(Box)`
  display: flex;
  flex-direction: row;
  text-align: left;
`

const InvestorName = styled.div``

const Flag = styled.div`
  margin-left: 10px;
`

export default App
