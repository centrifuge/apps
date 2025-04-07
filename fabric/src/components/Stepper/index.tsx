import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { Box } from '../Box'
import { Text } from '../Text'

type EnrichedStepProps = {
  activeStep?: number
  isFinal?: boolean
  isActive?: boolean
  count?: number
  setActiveStep?: React.Dispatch<number> | null
  maxStep?: number
  direction?: 'row' | 'column'
  variant?: 'primary' | 'secondary'
}

type StepProps = {
  label?: string
  empty?: boolean
  isStepCompleted?: boolean
}

type StepperProps = {
  activeStep: number
  setActiveStep: React.Dispatch<number> | null
  children: React.ReactNode
  direction?: 'row' | 'column'
}

const List = styled(Box)`
  list-style: none;
  counter-reset: step-counter;
`

const ListItem = styled(Box)<{ isActive?: boolean; empty?: boolean; isFinal?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const Hitearea = styled.button<{ direction?: string }>`
  border: none;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
`

const Number = styled(Text)<{ isActive?: boolean; done: boolean; variant?: 'primary' | 'secondary' }>`
  background-color: ${({ theme, isActive, done, variant }) =>
    isActive && !done
      ? theme.colors.textGold
      : done
      ? theme.colors.statusOkBg
      : variant === 'secondary'
      ? theme.colors.borderSecondary
      : 'transparent'};
  border: ${({ theme, isActive, done, variant }) =>
    isActive && !done
      ? `1px solid ${theme.colors.textGold}`
      : done
      ? `1px solid ${theme.colors.statusOk}`
      : variant === 'secondary'
      ? 'none'
      : `1.73px solid ${theme.colors.borderSecondary}`};
  border-radius: 100%;
  width: 32px;
  height: 32px;
  text-align: center;
  padding-top: ${({ variant }) => (variant === 'secondary' ? '8px' : '6px')};
  font-weight: 500;
  font-size: 12px;
`

const Line = ({ direction }: { direction: 'row' | 'column' }) => {
  const theme = useTheme()
  return (
    <Box
      borderTop={direction === 'row' ? `2px dashed ${theme.colors.borderSecondary}` : 'none'}
      borderLeft={direction === 'column' ? `2px dashed ${theme.colors.borderSecondary}` : 'none'}
      width={direction === 'row' ? '140px' : 0}
      height={direction === 'column' ? 80 : 0}
      mt={direction === 'row' ? 2 : 3}
      mb={direction === 'row' ? 0 : 3}
    />
  )
}

export const Step = (props: StepProps & EnrichedStepProps) => {
  const { isActive, count, label, empty, setActiveStep, direction, isStepCompleted, variant } = props

  return (
    <Box
      display="flex"
      flexDirection={direction || 'column'}
      alignItems={direction === 'row' ? 'flex-start' : 'center'}
      minWidth={120}
      justifyContent="center"
    >
      <ListItem forwardedAs="li">
        <Hitearea
          direction={direction}
          onClick={() => {
            !empty && setActiveStep && setActiveStep((count as number) + 1)
          }}
        >
          <Number isActive={isActive} done={isStepCompleted} variant={variant}>
            {count ? count + 1 : 1}
          </Number>
          <Text as="h3" variant="heading4" style={{ marginTop: 8 }}>
            {label}
          </Text>
        </Hitearea>
      </ListItem>
    </Box>
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
      return (
        <React.Fragment key={index}>
          {React.cloneElement(step as React.ReactElement<EnrichedStepProps & StepProps>, {
            activeStep: props.activeStep,
            isActive: index === props.activeStep - 1,
            count: index,
            setActiveStep: props.setActiveStep,
            maxStep: maxStep.current,
            direction: props.direction,
          })}
          {index !== stepsCount - 1 && <Line direction={props.direction || 'column'} />}
        </React.Fragment>
      )
    }
    return step
  })

  return (
    <List as="ol" role="list" display="flex" flexDirection={props.direction || 'column'} justifyContent="space-evenly">
      {stepItems}
    </List>
  )
}
