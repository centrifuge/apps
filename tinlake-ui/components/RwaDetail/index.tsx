import * as React from 'react'
import styled from 'styled-components'
import { Grid, Stack } from '../Layout'
import { HowItWorks } from './HowItWorks'
import { Invest } from './Invest'
import { KeyMetrics } from './KeyMetrics'
import { PageTitle } from './PageTitle'
import { RwaContextProvider } from './RwaContextProvider'
import { TokenDistribution } from './TokenDistribution'

export const RwaDetail: React.FC = () => {
  return (
    <RwaContextProvider>
      <Stack maxWidth="1152px" gap="24px" margin="0 auto" padding="0 16px">
        <PageTitle />

        <Section padding="16px 24px">
          <KeyMetrics />
        </Section>

        <Grid columns={2} equalColumns gap="24px">
          <Stack gap="24px">
            <Section padding="24px">
              <Invest />
            </Section>
            <Section padding="24px">
              <HowItWorks />
            </Section>
          </Stack>
          <Section padding="24px">
            <TokenDistribution />
          </Section>
        </Grid>
      </Stack>
    </RwaContextProvider>
  )
}

const Section = styled.div<{ padding?: string }>`
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #eee;
  ${({ padding }) => (padding ? `padding: ${padding};` : '')}
`
