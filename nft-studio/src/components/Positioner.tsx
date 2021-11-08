import { AriaPositionProps, OverlayContainer, useOverlayPosition } from '@react-aria/overlays'
import * as React from 'react'
import { useTheme } from 'styled-components'

type Props = {
  isShown?: boolean
  targetRef: React.RefObject<HTMLElement>
  overlayRef: React.RefObject<HTMLElement>
  placement?: AriaPositionProps['placement']
  offset?: number
  render: ({ positionProps }: { positionProps: React.HTMLAttributes<Element> }) => React.ReactElement
}

const PositionerInner: React.FC<Props> = ({
  isShown,
  targetRef,
  overlayRef,
  placement = 'top',
  offset = 1,
  render,
}) => {
  const theme = useTheme()
  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef,
    overlayRef,
    placement,
    offset: theme.space[offset] ?? offset,
    isOpen: isShown,
  })

  return render({ positionProps })
}

export const Positioner: React.FC<Props> = (props) => {
  return props.isShown ? (
    <OverlayContainer>
      <PositionerInner {...props} />
    </OverlayContainer>
  ) : null
}
