import { Box, Flex, Grid, IconX, Shelf, Stack, Step, Stepper } from '@centrifuge/fabric'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountsMenu } from '../../components/AccountsMenu'
import { Spinner } from '../../components/Spinner'
import { useWeb3 } from '../../components/Web3Provider'
import { config } from '../../config'
import { InvestorTypes } from '../../types'
import { useAuth } from '../../utils/useAuth'
import { InvestorType } from './InvestorType'
import { LinkWallet } from './LinkWallet'

const Logo = config.logo

export const OnboardingPage: React.FC = () => {
  const { selectedAccount, isLoading } = useWeb3()

  const [activeStep, setActiveStep] = useState<number>(0)

  const [investorType, setInvestorType] = useState<InvestorTypes>()
  const [isAgreedToDataSharingAgreement, setIsAgreedToDataSharingAgreement] = useState(false)
  const { isAuth, refetchAuth, isAuthFetched } = useAuth()

  const nextStep = () => setActiveStep((current) => current + 1)

  useEffect(() => {
    if (isAuthFetched && isAuth && activeStep === 0) {
      setActiveStep(2)
    } else if (isAuthFetched && !isAuth) {
      setActiveStep(1)
    } else if (!isLoading && selectedAccount === null) {
      setActiveStep(1)
    }
  }, [activeStep, isAuth, isAuthFetched, isLoading, selectedAccount])

  return (
    <Flex backgroundColor="backgroundSecondary" minHeight="100vh" flexDirection="column">
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
      {activeStep === 0 ? (
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
            <Stepper activeStep={activeStep}>
              <Step label="Link wallet" />
              <Step label="Selector investor type" />
              {investorType === 'individual' && (
                <>
                  <Step label="Identity verification" />
                  <Step label="Sign subscription agreement" />
                </>
              )}
              {investorType === 'entity' && (
                <>
                  <Step label="Business information" />
                  <Step label="Business ownership" />
                  <Step label="Authorized signer verification" />
                  <Step label="Tax information" />
                  <Step label="Sign subscription agreement" />
                </>
              )}
              {investorType === undefined && <Step empty />}
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
            {activeStep === 1 && <LinkWallet nextStep={nextStep} isAuth={!!isAuth} refetchAuth={refetchAuth} />}
            {activeStep === 2 && (
              <InvestorType
                investorType={investorType}
                isAgreedToDataSharingAgreement={isAgreedToDataSharingAgreement}
                nextStep={nextStep}
                setInvestorType={setInvestorType}
                setIsAgreedToDataSharingAgreement={setIsAgreedToDataSharingAgreement}
              />
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
