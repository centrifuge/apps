import * as React from 'react'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

type EnrichedStepProps = {
  activeStep?: number
  isFinal?: boolean
  isActive?: boolean
  count?: number
  setActiveStep?: (step: number) => void
  maxStep?: number
}

type StepProps = {
  label?: string
  empty?: boolean
}

type StepperProps = {
  activeStep: number
  setActiveStep: (step: number) => void
  children: React.ReactNode
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

export const Step = (props: StepProps & EnrichedStepProps) => {
  const { isActive, count, isFinal, activeStep, label, empty, setActiveStep, maxStep } = props

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

const flattenReactChildren = (childrenNodes: React.ReactNode): React.ReactNode[] => {
  const children = React.Children.toArray(childrenNodes)

  return children.reduce<React.ReactNode[]>((acc, child) => {
    if (React.isValidElement(child) && child.props.children) {
      return [...acc, ...flattenReactChildren(child.props.children)]
    }

    return [...acc, child]
  }, [])
}

export const Stepper = (props: StepperProps) => {
  const steps = flattenReactChildren(props.children)

  const stepsCount = steps.length

  const maxStep = React.useRef(1)

  React.useEffect(() => {
    if (props.activeStep > maxStep.current) {
      maxStep.current = props.activeStep
    }
  }, [props.activeStep])

  const stepItems = steps.map((step, index) => {
    if (React.isValidElement(step)) {
      return React.cloneElement(step as React.ReactElement<EnrichedStepProps & StepProps>, {
        key: index,
        activeStep: props.activeStep,
        isFinal: index === stepsCount - 1,
        isActive: index === props.activeStep - 1,
        count: index,
        setActiveStep: props.setActiveStep,
        maxStep: maxStep.current,
      })
    }
    return step
  })

  return <Box>{stepItems}</Box>
}
