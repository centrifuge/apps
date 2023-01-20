import { Box, Flex, Grid, IconX, Shelf, Stack, Step, Stepper } from '@centrifuge/fabric'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountsMenu } from '../../components/AccountsMenu'
import { useAuth } from '../../components/AuthProvider'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { Spinner } from '../../components/Spinner'
import { useWeb3 } from '../../components/Web3Provider'
import { config } from '../../config'
import { InvestorTypes } from '../../types'
import { BusinessInformation } from './BusinessInformation'
import { BusinessOwnership } from './BusinessOwnership'
import { InvestorType } from './InvestorType'
import { KnowYourCustomer } from './KnowYourCustomer'
import { LinkWallet } from './LinkWallet'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'sdf'
const poolId = '21323432'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export const OnboardingPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0)

  const { isConnecting, selectedAccount } = useWeb3()
  const [investorType, setInvestorType] = useState<InvestorTypes>()
  const { refetchAuth, isAuth } = useAuth(AUTHORIZED_ONBOARDING_PROXY_TYPES)
  const { onboardingUser, isOnboardingUserFetching, isOnboardingUserFetched } = useOnboardingUser()

  const nextStep = () => setActiveStep((current) => current + 1)
  const backStep = () => setActiveStep((current) => current - 1)

  useEffect(() => {
    if (!isConnecting && !isAuth) {
      return setActiveStep(1)
    }

    if (!isConnecting && isOnboardingUserFetched && (!selectedAccount || !Object.keys(onboardingUser).length)) {
      return setActiveStep(1)
    }

    if (!isConnecting && selectedAccount && onboardingUser) {
      if (onboardingUser.investorType === 'entity') {
        setInvestorType('entity')
        if (onboardingUser.steps.signAgreements[poolId][trancheId].completed) {
          return setActiveStep(7) // done
        } else if (onboardingUser.steps.verifyIdentity.completed) {
          return setActiveStep(6)
        } else if (onboardingUser.steps.confirmOwners.completed) {
          return setActiveStep(5)
        } else if (onboardingUser.steps.verifyBusiness.completed) {
          return setActiveStep(4)
        }

        return setActiveStep(1)
      }

      if (onboardingUser.investorType === 'individual') {
        setInvestorType('individual')
        if (onboardingUser.steps.signAgreements[poolId][trancheId].completed) {
          return setActiveStep(5) // done
        } else if (onboardingUser.steps.verifyIdentity.completed) {
          return setActiveStep(4)
        } else if (onboardingUser.name) {
          return setActiveStep(3)
        }

        return setActiveStep(1)
      }
    }
  }, [onboardingUser, isConnecting, selectedAccount, isOnboardingUserFetched, isAuth])

  return (
    <Flex backgroundColor="backgroundSecondary" minHeight="100vh" flexDirection="column">
      <Shelf as="header" justifyContent="space-between" gap={2} p={3}>
        <Shelf alignItems="center" gap={3}>
          <Box as={Link} to="/" width={110}>
            <WordMark />
          </Box>

          <Box pt={1}>Pool</Box>
        </Shelf>
        <Box width="300px">
          <AccountsMenu />
        </Box>
      </Shelf>
      {activeStep === 0 || isConnecting || isOnboardingUserFetching ? (
        <Box
          mx="150px"
          my={5}
          height="520px"
          borderRadius="18px"
          backgroundColor="backgroundPrimary"
          alignItems="flex-start"
        >
          <Flex height="100%" alignItems="center" justifyContent="center">
            <Spinner />
          </Flex>
        </Box>
      ) : (
        <Grid
          columns={4}
          mx="150px"
          my={5}
          height="100%"
          borderRadius="18px"
          backgroundColor="backgroundPrimary"
          alignItems="flex-start"
          gridTemplateColumns="350px 1px 1fr min-content"
        >
          <Box paddingTop={10} paddingLeft={7} paddingRight={7} paddingBottom={6}>
            <Stepper activeStep={activeStep} setActiveStep={setActiveStep}>
              <Step label="Link wallet" />
              <Step label="Selector investor type" />
              {investorType === 'individual' && (activeStep > 2 || !!onboardingUser?.investorType) && (
                <>
                  <Step label="Identity verification" />
                  <Step label="Sign subscription agreement" />
                </>
              )}
              {investorType === 'entity' && (activeStep > 2 || !!onboardingUser?.investorType) && (
                <>
                  <Step label="Business information" />
                  <Step label="Business ownership" />
                  <Step label="Authorized signer verification" />
                  <Step label="Sign subscription agreement" />
                </>
              )}
              {activeStep < 3 && !onboardingUser?.investorType && <Step empty />}
            </Stepper>
          </Box>
          <Box height="100%" backgroundColor="borderPrimary" />
          <Stack
            paddingTop={10}
            paddingLeft={7}
            paddingRight={7}
            paddingBottom={6}
            justifyContent="space-between"
            minHeight="520px"
          >
            {activeStep === 1 && <LinkWallet nextStep={nextStep} refetchAuth={refetchAuth} />}
            {activeStep === 2 && (
              <InvestorType
                investorType={investorType}
                nextStep={nextStep}
                backStep={backStep}
                setInvestorType={setInvestorType}
              />
            )}
            {investorType === 'entity' && (
              <>
                {activeStep === 3 && <BusinessInformation nextStep={nextStep} backStep={backStep} />}
                {activeStep === 4 && <BusinessOwnership nextStep={nextStep} backStep={backStep} />}
                {activeStep === 5 && <KnowYourCustomer backStep={backStep} nextStep={nextStep} />}
                {activeStep === 6 && null /* <SignSubscriptionAgreement backStep={backStep} nextStep={nextStep} /> */}
                {activeStep === 7 && null /* <Completed /> */}
              </>
            )}
            {investorType === 'individual' && (
              <>
                {activeStep === 3 && <KnowYourCustomer backStep={backStep} nextStep={nextStep} />}
                {activeStep === 4 && null /* <SignSubscriptionAgreement backStep={backStep} nextStep={nextStep} /> */}
                {activeStep === 5 && null /* <Completed /> */}
              </>
            )}
          </Stack>
          <Box paddingTop={4} paddingRight={4} justifyContent="flex-end">
            <Link to="/">
              <IconX color="textPrimary" />
            </Link>
          </Box>
        </Grid>
      )}
    </Flex>
  )
}
