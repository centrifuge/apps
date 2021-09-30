import * as React from 'react'
import styled from 'styled-components'
import { Shelf, Stack } from '../Layout'
import { Heading, Text } from '../Text'
import { CheckIcon } from './CheckIcon'
import { ClockIcon } from './ClockIcon'

export interface StepProps {
  title: string
  subtitle?: string
  state: 'active' | 'todo' | 'done'
  icon?: 'clock' | 'check'
  last?: boolean
}

export const Step: React.FC<StepProps> = ({
  title,
  subtitle,
  state,
  icon = state === 'done' ? 'check' : undefined,
  children,
  last,
}) => {
  const color = state === 'active' ? 'black' : '#bbbbbb'
  const iconEl =
    state === 'active' ? (
      <Circle filled />
    ) : icon === 'check' ? (
      <CheckIcon />
    ) : icon === 'clock' ? (
      <ClockIcon />
    ) : (
      <Circle />
    )
  return (
    <Shelf gap={['medium', 'large']} alignItems="stretch">
      <Stack alignItems="center" style={{ color }}>
        {iconEl}
        {!last && <Line />}
      </Stack>
      <Stack gap="small" pb={!last ? 'medium' : undefined}>
        <Shelf gap="xsmall" alignItems="baseline">
          <Heading lineHeight="24px" color={color}>
            {title}
          </Heading>
          {subtitle && (
            <Text fontSize="14px" color="#777777" fontWeight={500}>
              {subtitle}
            </Text>
          )}
        </Shelf>
        <MaybeEmptyStack gap="medium" alignItems="flex-start" pb="medium">
          {children}
        </MaybeEmptyStack>
      </Stack>
    </Shelf>
  )
}

const MaybeEmptyStack = styled(Stack)`
  &:empty {
    display: none;
  }
`

const Circle = styled.div<{ filled?: true }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background-color: ${(props) => props.filled && 'currentColor'};
`

const Line = styled.div`
  width: 2px;
  margin-top: -1px;
  margin-bottom: -1px;
  flex-grow: 1;
  background-color: currentColor;
`
