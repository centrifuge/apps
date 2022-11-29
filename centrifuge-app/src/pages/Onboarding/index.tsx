import { Box, Button, IconX, Shelf } from '@centrifuge/fabric'
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

  const nextStep = () => setActiveStep((current) => (current < 3 ? current + 1 : current))

  return (
    <Box backgroundColor="#F9F9F9" paddingBottom={5} display="flex" height="100%" flexDirection="column">
      <Box display="grid" gridTemplateColumns="auto 400px" justifyContent="space-between">
        <Shelf>
          <Link to="/">
            <Box px={2}>
              <Logo />
            </Box>
          </Link>
          <Box>Pool</Box>
        </Shelf>
        <Box px={8} alignSelf="center">
          <AccountsMenu />
        </Box>
      </Box>
      <Box
        display="grid"
        gridTemplateColumns="315px 2px auto auto"
        mx="150px"
        my={5}
        height="100%"
        borderRadius="18px"
        backgroundColor="white"
      >
        <Box paddingTop={10} paddingLeft={7} paddingRight={3} paddingBottom={6}>
          <Stepper activeStep={activeStep}>
            <Step label="Selector investor type" />
            <Step label="Identity verification" />
            <Step label="Sign subscription agreement" />
          </Stepper>
        </Box>
        <Box height="100%" width="1px" backgroundColor="#E0E0E0" />
        <Box
          paddingTop={10}
          paddingLeft={3}
          paddingRight={7}
          paddingBottom={6}
          display="grid"
          alignItems="space-between"
        >
          <InvestorType setInvestorType={setInvestorType} />
          <Box alignSelf="flex-end">
            <Button variant="secondary" onClick={nextStep}>
              Next
            </Button>
          </Box>
        </Box>
        <Box paddingTop={4} paddingRight={4} justifySelf="flex-end">
          <Link to="/">
            <IconX color="black" />
          </Link>
        </Box>
      </Box>
    </Box>
  )
}
