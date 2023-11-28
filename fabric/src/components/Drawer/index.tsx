import { useDialog } from '@react-aria/dialog'
import { FocusScope } from '@react-aria/focus'
import { OverlayContainer, useModal, useOverlay } from '@react-aria/overlays'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { IconX } from '../../icon'
import { Box } from '../Box'
import { Button } from '../Button'
import { Stack } from '../Stack'

export type DrawerProps = React.PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
  width?: string | number
}>

const DrawerCard = styled(Box)(
  css({
    boxShadow: 'cardOverlay',
  })
)

function DrawerInner({ children, isOpen, onClose, width = 'drawer' }: DrawerProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const underlayRef = React.useRef<HTMLDivElement>(null)
  const animation = React.useRef<Animation | undefined>(undefined)

  const { overlayProps, underlayProps } = useOverlay({ isOpen, onClose: handleClose, isDismissable: true }, ref)
  const { modalProps } = useModal()
  const { dialogProps } = useDialog({}, ref)

  React.useLayoutEffect(() => {
    animate(isOpen)
  }, [isOpen])

  function handleClose() {
    animate(false)
  }

  function animate(open: boolean) {
    if (!ref.current) return
    if (animation.current) {
      animation.current.onfinish = () => {}
    }

    if (open) {
      ref.current.style.transform = 'translateX(100%)'
      ref.current.style.opacity = '0'

      animation.current = ref?.current?.animate(
        {
          transform: 'translateX(0)',
          opacity: 1,
        },
        {
          duration: 300,
          easing: 'cubic-bezier(.17, .67, .35, .98)',
          fill: 'both',
        }
      )
    } else {
      animation.current = ref?.current?.animate(
        {
          transform: 'translateX(100%)',
          opacity: 0,
        },
        {
          duration: 200,
          easing: 'cubic-bezier(.17, .67, .35, .98)',
          fill: 'both',
        }
      )
      if (animation.current) animation.current.onfinish = () => onClose()
    }
  }

  return (
    <Box
      position="fixed"
      zIndex="overlay"
      top={0}
      left={0}
      bottom={0}
      right={0}
      display="flex"
      alignItems="stretch"
      justifyContent="flex-end"
      {...underlayProps}
      ref={underlayRef}
      style={{ pointerEvents: 'none' }}
    >
      <FocusScope contain restoreFocus autoFocus>
        <DrawerCard
          position="relative"
          px={3}
          pt={6}
          pb={4}
          width={width}
          maxWidth="100%"
          maxHeight="100dvh"
          overflow="hidden auto"
          bg="backgroundPage"
          {...overlayProps}
          {...dialogProps}
          {...modalProps}
          ref={ref}
          style={{ pointerEvents: 'auto' }}
        >
          <Stack gap={3}>
            <Box position="absolute" right="8px" top="8px">
              <Button variant="tertiary" icon={IconX} onClick={() => handleClose()} />
            </Box>
            {children}
          </Stack>
        </DrawerCard>
      </FocusScope>
    </Box>
  )
}

export function Drawer(props: DrawerProps) {
  return props.isOpen ? (
    <OverlayContainer>
      <DrawerInner {...props} />
    </OverlayContainer>
  ) : null
}
