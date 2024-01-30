import { Meta } from '@storybook/react'
import * as React from 'react'
import { Step, Stepper } from '.'
import { Button } from '../Button'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'

export default {
  title: 'Components/Stepper',
  component: Stepper,
} as Meta<typeof Stepper>

export const Default = () => {
  const totalSteps = 3
  const [activeStep, setActiveStep] = React.useState(1)

  const handlePreviousStep = () => {
    if (activeStep !== 1) {
      setActiveStep((prev) => prev - 1)
    }
  }

  const handleNextStep = () => {
    if (activeStep !== totalSteps) {
      setActiveStep((prev) => prev + 1)
    }
  }

  return (
    <Stack gap="24px">
      <Stepper activeStep={activeStep} setActiveStep={setActiveStep}>
        <Step label="Authorised signer verification" />
        <Step label="Step 2" />
        <Step label="Step 3" />
      </Stepper>
      <Shelf gap="12px">
        <Button onClick={() => handlePreviousStep()} disabled={activeStep === 1}>
          Back Step
        </Button>
        <Button onClick={() => handleNextStep()} disabled={activeStep === totalSteps}>
          Next Step
        </Button>
      </Shelf>
    </Stack>
  )
}
