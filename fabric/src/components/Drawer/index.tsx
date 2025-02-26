import { useDialog } from '@react-aria/dialog'
import { FocusScope } from '@react-aria/focus'
import { OverlayContainer, useModal, useOverlay } from '@react-aria/overlays'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { IconX } from '../../icon'
import { Box, BoxProps } from '../Box'
import { Button } from '../Button'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

const StyledIconButton = styled(Button)`
  width: 34px;
  height: 38px;
  border-radius: 4px;
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }
`

export type DrawerProps = React.PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
  width?: string | number
  innerPaddingTop?: number
  title?: React.ReactNode
}> &
  BoxProps

const DrawerCard = styled(Box)(
  css({
    boxShadow: 'cardOverlay',
  })
)

function DrawerInner({ title, children, isOpen, onClose, width = 'drawer', ...props }: DrawerProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const underlayRef = React.useRef<HTMLDivElement>(null)
  const animation = React.useRef<Animation | undefined>(undefined)

  const { overlayProps, underlayProps } = useOverlay({ isOpen, onClose, isDismissable: true }, ref)
  const { modalProps } = useModal()
  const { dialogProps } = useDialog({}, ref)

  React.useLayoutEffect(() => {
    animate(isOpen)
  }, [isOpen])

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
          p={3}
          width={width}
          maxWidth="100%"
          maxHeight="100dvh"
          overflow="hidden auto"
          bg="backgroundPage"
          {...overlayProps}
          {...dialogProps}
          {...modalProps}
          ref={ref}
          style={{ pointerEvents: 'auto', containerType: 'size' }}
          {...props}
        >
          <Stack gap={3}>
            <Shelf justifyContent="space-between">
              <Text variant="heading2">{title}</Text>
              <StyledIconButton variant="tertiary" icon={IconX} onClick={() => onClose()} />
            </Shelf>
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
