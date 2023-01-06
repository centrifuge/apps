import { ComponentMeta } from '@storybook/react'
import React from 'react'
import { Step, Stepper } from '.'
import { Box } from '../Box'
import { Button } from '../Button'

export default {
  title: 'Components/Stepper',
  component: Stepper,
} as ComponentMeta<typeof Stepper>

export const Default = () => {
  const totalSteps = 3
  const [activeStep, setActiveStep] = React.useState(1)

  const handleBack = () => {
    if (activeStep !== 1) {
      setActiveStep((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (activeStep !== totalSteps) {
      setActiveStep((prev) => prev + 1)
    }
  }

  return (
    <Box>
      <Box height="300px">
        <Stepper activeStep={activeStep} setActiveStep={setActiveStep}>
          <Step label="Step 1" />
          <Step label="Step 2" />
          <Step label="Step 3" />
        </Stepper>
      </Box>
      <Button onClick={() => handleBack()} disabled={activeStep === 1}>
        Back
      </Button>
      <Button onClick={() => handleNext()} disabled={activeStep === totalSteps}>
        Next
      </Button>
    </Box>
  )
}
