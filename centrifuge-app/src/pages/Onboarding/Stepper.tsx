import { Box, Flex, Shelf } from '@centrifuge/fabric'
import React, { Children } from 'react'

type EnrichedStepProps = {
  activeStep?: number
  isFinal?: boolean
  isActive?: boolean
  count?: number
}

type StepProps = {
  label: string
}

type StepperProps = {
  activeStep: number
  children: React.ReactNode
}

export const Step = (props: StepProps & EnrichedStepProps) => {
  const { isActive, count, isFinal, activeStep, label } = props

  return (
    <>
      <Shelf gap={2}>
        <Flex
          backgroundColor={isActive ? 'textPrimary' : 'transparent'}
          border="2px solid"
          borderColor={isActive ? 'textPrimary' : 'borderPrimary'}
          minWidth="28px"
          height="28px"
          justifyContent="center"
          alignItems="center"
          borderRadius="50px"
          color={isActive ? 'backgroundPrimary' : 'borderPrimary'}
        >
          {(count as number) + 1}
        </Flex>
        <Flex justifyContent="center" alignItems="center" maxHeight="28px" height="28px">
          {label}
        </Flex>
      </Shelf>
      {!isFinal && (
        <Box
          height={(activeStep as number) - 1 > (count as number) ? '30px' : '80px'}
          width="2px"
          backgroundColor={isActive ? 'textPrimary' : 'borderPrimary'}
          marginLeft="13px"
        />
      )}
    </>
  )
}

export const Stepper = (props: StepperProps) => {
  const stepsCount = Children.toArray(props.children).length

  const stepItems = Children.map(props.children, (child, index) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<EnrichedStepProps>, {
        activeStep: props.activeStep,
        isFinal: index === stepsCount - 1,
        isActive: index === props.activeStep - 1,
        count: index,
      })
    }
    return child
  })

  return <>{stepItems}</>
}
