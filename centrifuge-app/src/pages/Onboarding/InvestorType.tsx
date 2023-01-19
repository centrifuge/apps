import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Dispatch, SetStateAction } from 'react'
import styled from 'styled-components'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { InvestorTypes } from '../../types'

// TODO: use real pool title
const examplePool = {
  title: 'New Silver Junior Token',
}

type Props = {
  investorType: InvestorTypes | undefined
  nextStep: () => void
  backStep: () => void
  setInvestorType: Dispatch<SetStateAction<InvestorTypes | undefined>>
}

const InvestorTypeButton = styled(Button)<{ selected: boolean }>`
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  width: 457px;
  height: 60px;
  border-radius: 8px;

  > span {
    background-color: ${(props) => (props.selected ? '#e0e0e0' : 'white')};
    border-color: #e0e0e0;
    width: 100%;
    height: 100%;
    border-radius: 8px;

    &:active {
      box-shadow: none;
      border-color: #e0e0e0;
      background-color: ${(props) => (props.selected ? '#e0e0e0' : '#d8d8d8')};
    }

    &:hover {
      background-color: ${(props) => (props.selected ? '#e0e0e0' : '#d8d8d8')};
      border-color: transparent;
    }
  }
`

export const InvestorType = ({ investorType, backStep, nextStep, setInvestorType }: Props) => {
  const { onboardingUser } = useOnboardingUser()

  const isDisabled = onboardingUser?.investorType ? true : false

  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Start onboarding to {examplePool.title}</Text>
        <Stack gap={2} py={6}>
          <InvestorTypeButton
            onClick={() => setInvestorType('individual')}
            selected={investorType === 'individual'}
            disabled={isDisabled}
          >
            <Text variant="heading3">Individual</Text>
          </InvestorTypeButton>
          <InvestorTypeButton
            onClick={() => setInvestorType('entity')}
            selected={investorType === 'entity'}
            disabled={isDisabled}
          >
            <Text variant="heading3">Entity</Text>
          </InvestorTypeButton>
        </Stack>
        <Shelf gap="2">
          <Button onClick={() => backStep()} variant="secondary">
            Back
          </Button>
          <Button onClick={() => nextStep()} disabled={!investorType}>
            Next
          </Button>
        </Shelf>
      </Box>
    </Stack>
  )
}
