import { FocusScope } from '@react-aria/focus'
import { useOverlay, useOverlayTrigger } from '@react-aria/overlays'
import { OverlayTriggerState, useOverlayTriggerState } from '@react-stately/overlays'
import * as React from 'react'
import { Positioner } from '../Positioner'

type Props = {
  renderTrigger: (
    props: React.HTMLAttributes<HTMLButtonElement>,
    ref: React.RefObject<HTMLDivElement>,
    state: OverlayTriggerState
  ) => React.ReactElement
  renderContent: (
    props: React.HTMLAttributes<HTMLElement>,
    ref: React.RefObject<HTMLDivElement>,
    state: OverlayTriggerState
  ) => React.ReactElement
}

export const Popover: React.FC<Props> = ({ renderTrigger, renderContent }) => {
  const state = useOverlayTriggerState({})
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  // Get props for the trigger and overlay. This also handles
  // hiding the overlay when a parent element of the trigger scrolls
  // (which invalidates the popover positioning).
  const { triggerProps: triggerAriaProps, overlayProps: overlayAriaProps } = useOverlayTrigger(
    { type: 'dialog' },
    state,
    triggerRef
  )

  const { overlayProps: overlayBehaviorProps } = useOverlay(
    {
      onClose: state.close,
      isOpen: state.isOpen,
      isDismissable: true,
    },
    overlayRef
  )

  return (
    <>
      {renderTrigger({ ...triggerAriaProps, onClick: () => state.open() }, triggerRef, state)}
      {state.isOpen && (
        <Positioner
          isShown
          targetRef={triggerRef}
          overlayRef={overlayRef}
          render={(positionProps) => (
            <FocusScope contain restoreFocus autoFocus>
              {renderContent({ ...positionProps, ...overlayAriaProps, ...overlayBehaviorProps }, overlayRef, state)}
            </FocusScope>
          )}
        />
      )}
    </>
  )
}
