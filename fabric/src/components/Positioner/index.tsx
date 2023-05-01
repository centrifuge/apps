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

const PositionerInner: React.FC<PositionerProps> = ({
  isShown,
  targetRef,
  overlayRef,
  placement = 'bottom',
  offset = 1,
  render,
}) => {
  const theme = useTheme()
  const { overlayProps, ...restProps } = useOverlayPosition({
    targetRef,
    overlayRef,
    placement,
    offset: theme.space[offset] ?? offset,
    isOpen: isShown,
  })

  return render({ ...overlayProps, pointer: restProps.placement })
}

export const Positioner: React.FC<PositionerProps> = (props) => {
  return props.isShown ? (
    <OverlayContainer>
      <TextContext.Provider value={false}>
        <PositionerInner {...props} />
      </TextContext.Provider>
    </OverlayContainer>
  ) : null
}
