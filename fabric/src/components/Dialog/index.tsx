import { useDialog } from '@react-aria/dialog'
import { FocusScope } from '@react-aria/focus'
import { OverlayContainer, useModal, useOverlay, usePreventScroll } from '@react-aria/overlays'
import * as React from 'react'
import { ResponsiveValue } from 'styled-system'
import { IconX } from '../../icon'
import { Size } from '../../utils/types'
import { Box } from '../Box'
import { Button } from '../Button'
import { Card } from '../Card'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

type IconProps = {
  size?: ResponsiveValue<Size>
}

type Props = React.PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
  width?: string | number
  title?: string | React.ReactElement
  subtitle?: string | React.ReactElement
  icon?: React.ComponentType<IconProps> | React.ReactElement
  children?: React.ReactNode
}>

const DialogInner: React.FC<Props> = ({
  children,
  isOpen,
  onClose,
  width = 'dialog',
  icon: IconComp,
  title,
  subtitle,
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const underlayRef = React.useRef<HTMLDivElement>(null)
  const { overlayProps, underlayProps } = useOverlay(
    { isOpen, onClose, isDismissable: true, shouldCloseOnInteractOutside: (target) => target === underlayRef.current },
    ref
  )

  usePreventScroll()
  const { modalProps } = useModal()

  const { dialogProps } = useDialog({}, ref)

  return (
    <Box
      position="fixed"
      zIndex="overlay"
      top={0}
      left={0}
      bottom={0}
      right={0}
      bg="rgba(0, 0, 0, 0.7)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...underlayProps}
      ref={underlayRef}
    >
      <FocusScope contain restoreFocus autoFocus>
        <Card
          position="relative"
          px={3}
          pt={3}
          pb={4}
          width={width}
          maxWidth="100%"
          {...overlayProps}
          {...dialogProps}
          {...modalProps}
          ref={ref}
        >
          <Stack gap={3}>
            <Stack>
              <Shelf gap={2}>
                {IconComp && (isComponent(IconComp) ? <IconComp size="iconMedium" /> : IconComp)}
                {typeof title === 'string' ? <Text variant="heading2">{title}</Text> : title}

                <Button variant="tertiary" icon={IconX} onClick={() => onClose()} style={{ marginLeft: 'auto' }} />
              </Shelf>
              {subtitle && <Text variant="body2">{subtitle}</Text>}
            </Stack>
            {children}
          </Stack>
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

function isComponent(object: any): object is React.ComponentType {
  return typeof object === 'function'
}
