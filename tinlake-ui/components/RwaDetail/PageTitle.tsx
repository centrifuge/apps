import * as React from 'react'
import styled from 'styled-components'
import { Stack } from '../Layout'

export const PageTitle: React.FC = () => {
  return (
    <div>
      <Flex>
        <Icon src="/static/rwa/rwa-detail-logo.svg" />

        <Stack gap="4px" marginLeft="24px">
          <Title>Real-World Asset Market</Title>
          <SubTitle>A diversified portfolio of Tinlake pools built on Centrifuge & Aave</SubTitle>
        </Stack>
      </Flex>
      <WelcomeMsg>
        The RWA Market is the first diversified real-world asset market on the Aave Protocol based on Tinlake pools.
        Start onboarding now to invest your USDC.
      </WelcomeMsg>
    </div>
  )
}

const Flex = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 112px;
`

const Icon = styled.img`
  width: 40px;
  height: 40px;
`

const Title = styled.div`
  font-weight: 600;
  font-size: 24px;
  line-height: 125%;
`

const SubTitle = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  color: #757575;
`

const WelcomeMsg = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  margin: 16px 0;
`
