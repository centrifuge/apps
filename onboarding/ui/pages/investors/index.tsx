import { Box, DataTable } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import Header from '../../components/Header'

interface Props {
  onboardingApiHost: string
  etherscanUrl: string
}

const seedInvestors = [
  {
    name: 'John Doe',
    dropBalance: '1.000',
    tinBalance: '0',
  },
]

const App: React.FC<Props> = (props: Props) => {
  return (
    <Wrapper>
      <Header onboardingApiHost={props.onboardingApiHost} />
      <Content>
        <Box elevation="small" round="xsmall" pad={{ top: 'xsmall' }} margin={{ bottom: 'medium' }} background="white">
          <DataTable
            style={{ tableLayout: 'auto' }}
            data={seedInvestors}
            sort={{ direction: 'desc', property: 'loanId' }}
            pad="xsmall"
            sortable
            columns={[
              {
                header: 'Name',
                property: 'name',
                align: 'center',
                size: '140px',
              },
              {
                header: 'DROP balance',
                property: 'dropBalance',
                align: 'center',
                size: '140px',
              },
              {
                header: 'TIN balance',
                property: 'tinBalance',
                align: 'center',
                size: '140px',
              },
            ]}
          />
        </Box>
      </Content>
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

const Content = styled.div`
  max-width: 1000px;
  margin: 40px auto;
`

export default App
