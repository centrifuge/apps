import { Box, Card, Stack, Text } from '@centrifuge/fabric'
import { Dispatch, SetStateAction, useEffect } from 'react'
import styled from 'styled-components'
import { InvestorTypes } from '../../types'

const examplePool = {
  title: 'New Silver Junior Token',
}

type Props = {
  investorType: InvestorTypes | undefined
  nextStep: () => void
  setInvestorType: Dispatch<SetStateAction<InvestorTypes | undefined>>
}

const InvestorTypeCard = styled(Card)`
  cursor: pointer;

  &:hover {
    background-color: #e0e0e0;
  }
`

export const InvestorType = ({ investorType, nextStep, setInvestorType }: Props) => {
  useEffect(() => {
    if (investorType) {
      nextStep()
    }
  }, [investorType, nextStep])

  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Start onboarding to {examplePool.title}</Text>
        <Stack gap={2} py={6}>
          <InvestorTypeCard
            width="457px"
            height="60px"
            alignItems="center"
            justifyContent="center"
            display="flex"
            onClick={() => setInvestorType('individual')}
          >
            <Text variant="heading3">Individual</Text>
          </InvestorTypeCard>
          <InvestorTypeCard
            width="457px"
            height="60px"
            alignItems="center"
            justifyContent="center"
            display="flex"
            onClick={() => setInvestorType('entity')}
          >
            <Text variant="heading3">Entity</Text>
          </InvestorTypeCard>
        </Stack>
      </Box>
    </Stack>
  )
}
