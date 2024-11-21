import { Box, Button, Step, Stepper, Text } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import { useEffect, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { useIsAboveBreakpoint } from '../../../src/utils/useIsAboveBreakpoint'
import { PoolDetailsSection } from './PoolDetailsSection'
import { PoolSetupSection } from './PoolSetupSection'
import { Line, PoolStructureSection } from './PoolStructureSection'
import { initialValues } from './types'
import { validateValues } from './validate'

const StyledBox = styled(Box)`
  padding: 48px 80px 0px 80px;
  @media (max-width: ${({ theme }) => theme.breakpoints.S}) {
    padding: 12px;
  }
`

const stepFields: { [key: number]: string[] } = {
  1: ['assetClass', 'assetDenomination', 'subAssetClass'],
  2: [
    'poolName',
    'poolIcon',
    'investorType',
    'maxReserve',
    'poolType',
    'issuerName',
    'issuerShortDescription',
    'issuerDescription',
  ],
  3: ['investmentDetails', 'liquidityDetails'],
}

const IssuerCreatePoolPage = () => {
  const theme = useTheme()
  const formRef = useRef<HTMLFormElement>(null)
  const isSmall = useIsAboveBreakpoint('S')
  const [step, setStep] = useState(1)
  const [stepCompleted, setStepCompleted] = useState({ 1: false, 2: false, 3: false })

  const form = useFormik({
    initialValues: initialValues,
    validate: (values) => validateValues(values),
    validateOnMount: true,
    onSubmit: () => console.log('a'),
  })

  const { values, errors } = form

  const checkStepCompletion = (stepNumber: number) => {
    const fields = stepFields[stepNumber]
    return fields.every(
      (field) =>
        values[field as keyof typeof values] !== null &&
        values[field as keyof typeof values] !== '' &&
        !errors[field as keyof typeof errors]
    )
  }

  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1)
  }

  useEffect(() => {
    setStepCompleted((prev) => ({
      ...prev,
      [step]: checkStepCompletion(step),
    }))
  }, [values, step])

  return (
    <>
      <FormikProvider value={form}>
        <Form ref={formRef} noValidate>
          <Box padding={3}>
            <Text variant="heading2">New pool setup</Text>
          </Box>
          <Box
            backgroundColor={theme.colors.backgroundSecondary}
            padding={isSmall ? '32px 208px' : '12px'}
            borderTop={`1px solid ${theme.colors.borderPrimary}`}
            borderBottom={`1px solid ${theme.colors.borderPrimary}`}
          >
            <Stepper activeStep={step} setActiveStep={setStep} direction="row">
              <Step label="Pool structure" isStepCompleted={stepCompleted[1]} />
              <Step label="Pool details" isStepCompleted={stepCompleted[2]} />
              <Step label="Pool setup" />
            </Stepper>
          </Box>
          <StyledBox padding="48px 80px 0px 80px">
            {step === 1 && <PoolStructureSection />}
            {step === 2 && <PoolDetailsSection />}
            {step === 3 && <PoolSetupSection />}
            <Line />
            <Box display="flex" justifyContent="flex-end" mt={2} mb={4}>
              {step !== 1 && (
                <Button
                  style={{ width: 163, marginRight: 8 }}
                  small
                  onClick={() => setStep(step - 1)}
                  variant="inverted"
                >
                  Previous
                </Button>
              )}
              <Button style={{ width: 163 }} small onClick={handleNextStep}>
                {step === 3 ? 'Create pool' : 'Next'}
              </Button>
            </Box>
          </StyledBox>
        </Form>
      </FormikProvider>
    </>
  )
}

export default IssuerCreatePoolPage
