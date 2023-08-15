import { Box } from '@centrifuge/fabric'
import { useDialog } from '@react-aria/dialog'
import { FocusScope } from '@react-aria/focus'
import { OverlayContainer, useModal, useOverlay, usePreventScroll } from '@react-aria/overlays'
import * as React from 'react'
import { useTheme } from 'styled-components'

export type SideDrawerProps = {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
}

export function SideDrawer(props: SideDrawerProps) {
  return props.isOpen ? (
    <OverlayContainer>
      <SideDrawerInner {...props} />
    </OverlayContainer>
  ) : null
}

export function SideDrawerInner({ children, isOpen, onClose }: SideDrawerProps) {
  const theme = useTheme()
  const ref = React.useRef<HTMLDivElement>(null)
  const underlayRef = React.useRef<HTMLDivElement>(null)
  const { overlayProps, underlayProps } = useOverlay(
    { isOpen, onClose, isDismissable: true, shouldCloseOnInteractOutside: (target) => target === underlayRef.current },
    ref
  )
  const { space } = useTheme()

  usePreventScroll()
  const { modalProps } = useModal()
  const { dialogProps } = useDialog({}, ref)

  return (
    <Box position="fixed" zIndex="overlay" top={0} left={0} bottom={0} right={0} {...underlayProps} ref={underlayRef}>
      <FocusScope contain restoreFocus autoFocus>
        <Box
          position="relative"
          height="100%"
          overflowY="auto"
          ml="auto"
          width={[`calc(100% - ${space[5]}px)`, 440]}
          p={3}
          borderStyle="solid"
          borderColor="borderPrimary"
          borderLeftWidth={1}
          backgroundColor="backgroundPrimary"
          style={{
            boxShadow: `0px 0px 20px ${theme.colors.borderSecondary}`,
          }}
          {...overlayProps}
          {...dialogProps}
          {...modalProps}
          ref={ref}
        >
          {children}
        </Box>
      </FocusScope>
    </Box>
  )
}
