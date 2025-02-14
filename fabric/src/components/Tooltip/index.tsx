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
  bodyWidth?: string | number
  bodyPadding?: string | number
  triggerStyle?: React.CSSProperties
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
  background-color: ${({ theme }) => theme.colors.backgroundInverted};
  filter: ${({ theme }) => `drop-shadow(${theme.shadows.cardInteractive})`};
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  will-change: opacity, transform;

  &.show {
    opacity: 1;
    transform: translateY(0);
  }

  &::before {
    --size: 5px;
    content: '';
    position: absolute;
    ${({ pointer }) => placements[pointer!]}
    border: ${({ theme }) => `var(--size) solid ${theme.colors.backgroundInverted}`};
    transform: rotate(-45deg);
  }
`

export function Tooltip({
  title,
  body,
  children,
  disabled,
  delay = 200,
  bodyWidth,
  bodyPadding,
  triggerStyle,
  placement = 'top',
  ...textProps
}: TooltipProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)

  const config = { isDisabled: disabled, delay }

  const state = useTooltipTriggerState(config)
  const { triggerProps, tooltipProps } = useTooltipTrigger(config, state, triggerRef)
  const { tooltipProps: tooltipElementProps } = useTooltip(tooltipProps, state)

  return (
    <>
      <StyledTrigger ref={triggerRef} {...triggerProps} tabIndex={0} {...textProps} style={triggerStyle}>
        {children}
      </StyledTrigger>
      {state.isOpen && (
        <Positioner
          isShown
          targetRef={triggerRef}
          overlayRef={overlayRef}
          placement={placement}
          render={({ pointer, ...rest }) => (
            <Container
              {...tooltipElementProps}
              {...rest}
              ref={overlayRef}
              className={state.isOpen ? 'show' : ''}
              backgroundColor="backgroundPrimary"
              p={bodyPadding ?? 1}
              borderRadius="tooltip"
              width={bodyWidth ?? 220}
              gap="3px"
              pointer={pointer}
            >
              {!!title && (
                <Text variant="body3" fontWeight={600} color="white">
                  {title}
                </Text>
              )}
              <Text variant="body4" color="white">
                {body}
              </Text>
            </Container>
          )}
        />
      )}
    </>
  )
}
