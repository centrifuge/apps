import { Box, Button, Flex, IconX, Shelf, Stack } from '@centrifuge/fabric'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountsMenu } from '../../components/AccountsMenu'
import { config } from '../../config'
import { InvestorTypes } from '../../types'
import { InvestorType } from './InvestorType'
import { Step, Stepper } from './Stepper'

const Logo = config.logo

export const OnboardingPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1)
  const [investorType, setInvestorType] = useState<InvestorTypes>()
  const [isAgreedToDataSharingAgreement, setIsAgreedToDataSharingAgreement] = useState(false)

  const nextStep = () => setActiveStep((current) => current + 1)

  return (
    <Flex backgroundColor="backgroundSecondary" paddingBottom={5} height="100%" flexDirection="column">
      <Shelf justifyContent="space-between">
        <Shelf>
          <Link to="/">
            <Box px={2}>
              <Logo />
            </Box>
          </Link>
          <Box>Pool</Box>
        </Shelf>
        <Box px={6} alignSelf="center" width="400px">
          <AccountsMenu />
        </Box>
      </Shelf>
      <Shelf
        mx="150px"
        my={5}
        height="100%"
        borderRadius="18px"
        backgroundColor="backgroundPrimary"
        alignItems="flex-start"
      >
        <Box paddingTop={10} paddingLeft={7} paddingRight={3} paddingBottom={6} width="300px">
          <Stepper activeStep={activeStep}>
            <Step label="Selector investor type" />
            <Step label="Identity verification" />
            <Step label="Sign subscription agreement" />
          </Stepper>
        </Box>
        <Box height="100%" width="1px" backgroundColor="borderPrimary" />
        <Stack
          paddingTop={10}
          paddingLeft={3}
          paddingRight={7}
          paddingBottom={6}
          justifyContent="space-between"
          height="100%"
        >
          <InvestorType
            investorType={investorType}
            isAgreedToDataSharingAgreement={isAgreedToDataSharingAgreement}
            nextStep={nextStep}
            setInvestorType={setInvestorType}
            setIsAgreedToDataSharingAgreement={setIsAgreedToDataSharingAgreement}
          />
          <Box>
            <Button variant="secondary" onClick={nextStep} disabled={!investorType || !isAgreedToDataSharingAgreement}>
              Next
            </Button>
          </Box>
        </Stack>
        <Box paddingTop={4} paddingRight={4}>
          <Link to="/">
            <IconX color="textPrimary" />
          </Link>
        </Box>
      </Shelf>
    </Flex>
  )
}
