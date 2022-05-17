import { useTooltip, useTooltipTrigger } from '@react-aria/tooltip'
import { useTooltipTriggerState } from '@react-stately/tooltip'
import * as React from 'react'
import styled from 'styled-components'
import { Positioner } from '../Positioner'
import { Stack } from '../Stack'
import { Text, TextProps } from '../Text'

type TooltipProps = TextProps & {
  title?: string
  body: string | (() => React.ReactElement)
  disabled?: boolean
  delay?: number
}

const StyledTrigger = styled(Text)`
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  position: relative;
  text-decoration: underline dotted;
  cursor: pointer;
  text-align: left;
  font-weight: 400;
`

export const Tooltip: React.FC<TooltipProps> = ({ title, body, children, disabled, delay = 1000, ...textProps }) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)

  const config = { isDisabled: disabled, delay }

  const state = useTooltipTriggerState(config)
  const { triggerProps, tooltipProps } = useTooltipTrigger(config, state, triggerRef)
  const { tooltipProps: tooltipElementProps } = useTooltip(tooltipProps, state)

  return (
    <>
      <StyledTrigger as="button" fontFamiliy="Inter" ref={triggerRef} {...triggerProps} {...textProps}>
        {children}
      </StyledTrigger>
      {state.isOpen && (
        <Positioner
          isShown
          targetRef={triggerRef}
          overlayRef={overlayRef}
          render={(positionProps) => (
            <Stack
              {...tooltipElementProps}
              {...positionProps}
              ref={overlayRef}
              backgroundColor="textPrimary"
              p={1}
              borderRadius="tooltip"
              width={220}
            >
              <Text variant="label2" color="backgroundPrimary">
                {title}
              </Text>
              <Text variant="body3" color="backgroundPrimary">
                {typeof body !== 'string' ? body() : body}
              </Text>
            </Stack>
          )}
        />
      )}
    </>
  )
}
