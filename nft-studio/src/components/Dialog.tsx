import { Box, Card } from '@centrifuge/fabric'
import { useDialog } from '@react-aria/dialog'
import { FocusScope } from '@react-aria/focus'
import { OverlayContainer, useModal, useOverlay, usePreventScroll } from '@react-aria/overlays'
import * as React from 'react'

type Props = {
  isOpen?: boolean
  onClose?: () => void
  width?: string | number
}

const DialogInner: React.FC<Props> = ({ children, isOpen, onClose, width = 'dialog' }) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const { overlayProps, underlayProps } = useOverlay({ isOpen, onClose, isDismissable: true }, ref)

  usePreventScroll()
  const { modalProps } = useModal()

  const { dialogProps } = useDialog({}, ref)

  return (
    <Box
      position="fixed"
      zIndex={100}
      top={0}
      left={0}
      bottom={0}
      right={0}
      bg="rgba(0, 0, 0, 0.7)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...underlayProps}
    >
      <FocusScope contain restoreFocus autoFocus>
        <Card p={3} width={width} maxWidth="100%" {...overlayProps} {...dialogProps} {...modalProps} ref={ref}>
          {children}
        </Card>
      </FocusScope>
    </Box>
  )
}

export const Dialog: React.FC<Props> = (props) => {
  return props.isOpen ? (
    <OverlayContainer>
      <DialogInner {...props} />
    </OverlayContainer>
  ) : null
}
