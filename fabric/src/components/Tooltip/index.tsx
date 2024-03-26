import { PlacementAxis } from '@react-aria/overlays'
import { useTooltip, useTooltipTrigger } from '@react-aria/tooltip'
import { useTooltipTriggerState } from '@react-stately/tooltip'
import css, { CssFunctionReturnType } from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { Positioner } from '../Positioner'
import { Stack } from '../Stack'
import { Text, TextProps } from '../Text'

export type TooltipProps = TextProps & {
  title?: string
  body: string | React.ReactNode
  disabled?: boolean
  delay?: number
}

const StyledTrigger = styled(Text)`
  position: relative;
  width: fit-content;
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-weight: 400;
  font-family: ${({ theme }) => theme.fonts.standard};
  text-decoration: underline dotted ${({ theme }) => theme.colors.textSecondary};
  text-underline-offset: 3px;
`

const placements: {
  [key in PlacementAxis as string]: CssFunctionReturnType
} = {
  bottom: css({
    top: 'calc( var(--size) * -1)',
    left: 'calc(50% - var(--size))',
  }),

  top: css({
    bottom: 'calc( var(--size) * -1)',
    left: 'calc(50% - var(--size))',
  }),

  left: css({
    top: 'calc(50% - var(--size))',
    right: 'calc( var(--size) * -1)',
  }),

  right: css({
    top: 'calc(50% - var(--size))',
    left: 'calc( var(--size) * -1)',
  }),
}

const Container = styled(Stack)<{ pointer: PlacementAxis }>`
  filter: ${({ theme }) => `drop-shadow(${theme.shadows.cardInteractive})`};

  &::before {
    --size: 5px;

    content: '';
    position: absolute;
    ${({ pointer }) => placements[pointer!]}
    border: ${({ theme }) => `var(--size) solid ${theme.colors.backgroundPrimary}`};
    transform: rotate(-45deg);
  }
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
      <StyledTrigger ref={triggerRef} {...triggerProps} tabIndex={0} {...textProps}>
        {children}
      </StyledTrigger>
      {state.isOpen && (
        <Positioner
          isShown
          targetRef={triggerRef}
          overlayRef={overlayRef}
          placement="top"
          render={({ pointer, ...rest }) => (
            <Container
              {...tooltipElementProps}
              {...rest}
              ref={overlayRef}
              backgroundColor="backgroundPrimary"
              p={1}
              borderRadius="tooltip"
              width={220}
              gap="3px"
              pointer={pointer}
            >
              {!!title && (
                <Text variant="body3" fontWeight={600}>
                  {title}
                </Text>
              )}
              <Text variant="body3">{body}</Text>
            </Container>
          )}
        />
      )}
    </>
  )
}
