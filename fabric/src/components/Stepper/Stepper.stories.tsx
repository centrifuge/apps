import { ComponentMeta } from '@storybook/react'
import React, { useState } from 'react'
import { Step, Stepper, SubStep } from '.'
import { Button } from '../Button'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'

export default {
  title: 'Components/Stepper',
  component: Stepper,
} as ComponentMeta<typeof Stepper>

export const Default = () => {
  const totalSteps = 3
  const totalSubSteps = 6
  const [activeStep, setActiveStep] = useState(1)
  const [activeSubStep, setActiveSubStep] = useState(1)

  const handleBackStep = () => {
    if (activeStep !== 1) {
      setActiveStep((prev) => prev - 1)
    }
  }

  const handleNextStep = () => {
    if (activeStep !== totalSteps) {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBackSubStep = () => {
    if (activeSubStep !== 1) {
      setActiveSubStep((prev) => prev - 1)
    }
  }

  const handleNextSubStep = () => {
    if (activeSubStep !== totalSubSteps) {
      setActiveSubStep((prev) => prev + 1)
    }
  }

  return (
    <Stack gap="24px">
      <Stepper activeStep={activeStep} setActiveStep={setActiveStep}>
        <>
          <Step label="Authorised signer verification" activeSubStep={activeSubStep}>
            <SubStep label="Country of issuance" />
            <SubStep label="Photo ID" />
            <SubStep label="Liveliness check" />
            <SubStep label="4" />
            <SubStep label="5" />
            <SubStep label="6" />
          </Step>
        </>
        <Step label="Step 2" />
        <Step label="Step 3" />
      </Stepper>
      <Shelf gap="12px">
        <Button onClick={() => handleBackStep()} disabled={activeStep === 1}>
          Back Step
        </Button>
        <Button onClick={() => handleNextStep()} disabled={activeStep === totalSteps}>
          Next Step
        </Button>
      </Shelf>
      <Shelf gap="12px">
        <Button onClick={() => handleBackSubStep()} disabled={activeSubStep === 1}>
          Back Sub Step
        </Button>
        <Button onClick={() => handleNextSubStep()} disabled={activeSubStep === totalSubSteps}>
          Next Sub Step
        </Button>
      </Shelf>
    </Stack>
  )
}
