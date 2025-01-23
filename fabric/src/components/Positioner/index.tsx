import { AriaPositionProps, OverlayContainer, PlacementAxis, useOverlayPosition } from '@react-aria/overlays'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { TextContext } from '../Text'

type PositionerProps = {
  isShown?: boolean
  targetRef: React.RefObject<HTMLElement>
  overlayRef: React.RefObject<HTMLElement>
  placement?: AriaPositionProps['placement']
  offset?: number
  render: (props: React.HTMLAttributes<Element> & { pointer: PlacementAxis }) => React.ReactElement
}

function PositionerInner({
  isShown,
  targetRef,
  overlayRef,
  placement = 'bottom',
  offset = 1,
  render,
}: PositionerProps) {
  const theme = useTheme()
  const { overlayProps, ...restProps } = useOverlayPosition({
    targetRef,
    overlayRef,
    placement,
    offset: theme.space[offset] ?? offset,
    isOpen: isShown,
  })

  return render({ ...overlayProps, pointer: restProps.placement ?? 'bottom' })
}

export function Positioner(props: PositionerProps) {
  return props.isShown ? (
    <OverlayContainer>
      <TextContext.Provider value={false}>
        <PositionerInner {...props} />
      </TextContext.Provider>
    </OverlayContainer>
  ) : null
}
