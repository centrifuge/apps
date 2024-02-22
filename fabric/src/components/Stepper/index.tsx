import * as React from 'react'
import styled from 'styled-components'
import { Box } from '../Box'
import { Grid } from '../Grid'
import { Text } from '../Text'

type EnrichedStepProps = {
  activeStep?: number
  isFinal?: boolean
  isActive?: boolean
  count?: number
  setActiveStep?: React.Dispatch<number> | null
  maxStep?: number
}

type StepProps = {
  label?: string
  empty?: boolean
}

type StepperProps = {
  activeStep: number
  setActiveStep: React.Dispatch<number> | null
  children: React.ReactNode
}

const getStepColor = (isActive: boolean, empty: boolean) => {
  if (isActive) {
    return 'textPrimary'
  }
  if (empty) {
    return 'borderPrimary'
  }
  return 'transparent'
}

const counterSize = 28
const spaceDefault = 30
const spaceActive = 80

const List = styled(Box)`
  list-style: none;
  counter-reset: step-counter;
`

const ListItem = styled(Grid)<{ isActive?: boolean; empty?: boolean; isFinal?: boolean }>`
  --duration: 0.15s;
  counter-increment: step-counter;

  position: relative;
  place-content: center;
  place-items: center;
  justify-items: start;
  transition: margin-bottom var(--duration);

  &::before {
    content: counter(step-counter);
    width: ${counterSize}px;
    height: ${counterSize}px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${({ empty, isActive, theme }) => (theme.colors as any)[getStepColor(!!isActive, !!empty)]};
    border: 2px solid;
    border-color: ${({ theme, isActive }) => (isActive ? theme.colors.textPrimary : theme.colors.borderPrimary)};
    border-radius: 50%;
    color: ${({ theme, isActive }) => (isActive ? theme.colors.backgroundPrimary : theme.colors.borderPrimary)};
    transition: background-color var(--duration) linear, border-color var(--duration) linear,
      color var(--duration) linear;
  }

  &::after {
    content: '';
    display: ${({ isFinal }) => (isFinal ? 'none' : 'block')};
    position: absolute;
    top: 100%;
    left: ${counterSize * 0.5}px;
    height: ${({ isActive, isFinal }) => (isActive && !isFinal ? spaceActive : spaceDefault)}px;
    width: 2px;
    background-color: ${({ theme, isActive }) => (isActive ? theme.colors.textPrimary : theme.colors.borderPrimary)};
    transition: height var(--duration), background-color var(--duration) linear;
  }
`

const Hitearea = styled.button`
  --offset: 10px;

  position: absolute;
  top: calc(var(--offset) * -1);
  left: calc(var(--offset) * -1);
  width: calc(100% + var(--offset) * 2);
  height: calc(100% + var(--offset) * 2);
  appearance: none;
  background-color: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radii.input}px;
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => `2px solid ${theme.colors.accentPrimary}`};
  }
`

export const Step = (props: StepProps & EnrichedStepProps) => {
  const { isActive, count, isFinal, activeStep, label, empty, setActiveStep, maxStep } = props
  const isClickable = (count as number) + 1 < (activeStep as number) || (count as number) + 1 <= (maxStep as number)

  return (
    <ListItem
      forwardedAs="li"
      gridTemplateColumns={`${counterSize}px 1fr`}
      gap={2}
      height={counterSize}
      mb={isActive && !isFinal ? spaceActive : spaceDefault}
      {...{ empty, isActive, isFinal }}
    >
      <Text as="h3" fontSize={18} lineHeight={1.2}>
        {label}
      </Text>
      {!empty && isClickable && setActiveStep && (
        <Hitearea
          title={`Step ${(count as number) + 1}`}
          onClick={() => {
            setActiveStep((count as number) + 1)
          }}
        />
      )}
    </ListItem>
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

  return (
    <List as="ol" role="list">
      {stepItems}
    </List>
  )
}
