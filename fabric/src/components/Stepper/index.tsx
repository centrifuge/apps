import React, { useEffect, useRef } from 'react'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

type EnrichedStepProps = {
  activeStep?: number
  isFinal?: boolean
  isActive?: boolean
  count?: number
  setActiveStep?: (step: number) => void
  maxStep?: number
  numberOfSubSteps?: number
}

type StepProps = {
  label?: string
  empty?: boolean
  children?: React.ReactNode
  activeSubStep?: number
}

type StepperProps = {
  activeStep: number
  setActiveStep: (step: number) => void
  children: React.ReactNode
}

type SubStepsProps = {
  steps: React.ReactNode
  activeSubStep: number
}

type SubStepProps = {
  label: string
  isCompletedOrActive?: boolean
}

const getStepColor = (isActive: boolean, empty: boolean) => {
  if (isActive) {
    return 'textPrimary'
  } else {
    if (empty) {
      return 'borderPrimary'
    }
    return 'transparent'
  }
}

const getLineColor = (isActive: boolean, activeSubStep: number, numberOfSubSteps: number) => {
  const blackPercentage = activeSubStep * (100 / numberOfSubSteps)
  const grayPercentage = 100 - blackPercentage

  if (isActive) {
    if (activeSubStep === numberOfSubSteps) {
      return 'black'
    }
    return `linear-gradient(to bottom, black ${blackPercentage}%, #e0e0e0 ${blackPercentage}% ${grayPercentage}%)`
  }
  return '#e0e0e0'
}

export const SubSteps = (props: SubStepsProps) => {
  const { steps, activeSubStep } = props

  return (
    <Stack paddingLeft="28px" width="200px" gap="24px">
      {React.Children.map(steps, (child: { props: { label: string } }, index) => {
        const length = React.Children.toArray(steps).length

        return (
          <Box paddingTop={index === 0 ? '20px' : 0} paddingBottom={index === length - 1 ? '20px' : 0}>
            <SubStep label={child.props.label} isCompletedOrActive={activeSubStep >= index + 1} />
          </Box>
        )
      })}
    </Stack>
  )
}

export const SubStep = (props: SubStepProps) => {
  const { isCompletedOrActive, label } = props

  return (
    <Flex alignItems="center">
      <Text color={isCompletedOrActive ? 'textPrimary' : 'borderPrimary'}>{label}</Text>
    </Flex>
  )
}

export const Step = (props: StepProps & EnrichedStepProps) => {
  const {
    children,
    isActive,
    count,
    isFinal,
    activeStep,
    label,
    empty,
    setActiveStep,
    maxStep,
    activeSubStep,
    numberOfSubSteps,
  } = props

  return (
    <>
      <Shelf
        style={{ cursor: 'pointer' }}
        gap={2}
        onClick={() => {
          if ((count as number) + 1 < (activeStep as number) || (count as number) + 1 <= (maxStep as number)) {
            setActiveStep && setActiveStep((count as number) + 1)
          }
        }}
      >
        <Flex
          backgroundColor={getStepColor(!!isActive, !!empty)}
          border="2px solid"
          borderColor={isActive ? 'textPrimary' : 'borderPrimary'}
          minWidth="28px"
          height="28px"
          justifyContent="center"
          alignItems="center"
          borderRadius="50px"
          color={isActive ? 'backgroundPrimary' : 'borderPrimary'}
        >
          {empty ? '' : (count as number) + 1}
        </Flex>
        <Flex justifyContent="center" alignItems="center" maxHeight="28px" height="28px">
          <Text fontSize="18px">{label}</Text>
        </Flex>
      </Shelf>
      {!isFinal && (
        <Shelf
          height={(activeStep as number) - 1 > (count as number) ? '30px' : children ? '100%' : '80px'}
          minHeight={(activeStep as number) - 1 > (count as number) ? '30px' : '80px'}
        >
          <Box
            height={(activeStep as number) - 1 > (count as number) ? '30px' : children ? '100%' : '80px'}
            minHeight={(activeStep as number) - 1 > (count as number) ? '30px' : '80px'}
            width="2px"
            background={
              children
                ? getLineColor(isActive as boolean, activeSubStep as number, numberOfSubSteps as number)
                : isActive
                ? 'black'
                : '#e0e0e0'
            }
            marginLeft="13px"
          >
            {children && isActive && <SubSteps steps={children} activeSubStep={activeSubStep as number} />}
          </Box>
        </Shelf>
      )}
    </>
  )
}

const flattenReactChildren = (childrenNodes: React.ReactNode): React.ReactNode[] => {
  const children = React.Children.toArray(childrenNodes)

  return children.reduce<React.ReactNode[]>((acc, child) => {
    if (React.isValidElement(child) && child.type === React.Fragment && child.props.children) {
      return [...acc, ...flattenReactChildren(child.props.children)]
    }

    return [...acc, child]
  }, [])
}

export const Stepper = (props: StepperProps) => {
  const flattenedSteps = flattenReactChildren(props.children)

  const steps = React.Children.toArray(flattenedSteps)

  const stepsCount = steps.length

  const maxStep = useRef(1)

  useEffect(() => {
    if (props.activeStep > maxStep.current) {
      maxStep.current = props.activeStep
    }
  }, [props.activeStep])

  const stepItems = steps.map((step, index) => {
    if (React.isValidElement(step)) {
      return React.cloneElement(step as React.ReactElement<EnrichedStepProps & StepProps>, {
        activeStep: props.activeStep,
        isFinal: index === stepsCount - 1,
        isActive: index === props.activeStep - 1,
        count: index,
        setActiveStep: props.setActiveStep,
        maxStep: maxStep.current,
        children: step.props.children,
        activeSubStep: step.props.activeSubStep,
        numberOfSubSteps: React.Children.toArray(step.props.children).length,
      })
    }
    return step
  })

  return <Box>{stepItems}</Box>
}
