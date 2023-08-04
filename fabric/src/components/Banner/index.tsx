import { useModal, useOverlay } from '@react-aria/overlays'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { IconX } from '../../icon'
import { Button } from '../Button'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

type BannerProps = {
  title: string | React.ReactElement
  isOpen?: boolean
  onClose?: () => void
  children?: React.ReactNode
}

export const Banner: React.FC<BannerProps> = ({ children, title, ...props }) => {
  const theme = useTheme()
  const ref = React.useRef<HTMLDivElement>(null)
  const { overlayProps } = useOverlay({ ...props }, ref)
  const { modalProps } = useModal()

  return props.isOpen ? (
    <Shelf
      position="fixed"
      zIndex={theme.zIndices.overlay}
      bottom="24px"
      left="0"
      right="0"
      justifyContent="end"
      minWidth="500px"
      px={2}
    >
      <Stack
        {...overlayProps}
        {...modalProps}
        ref={ref}
        borderRadius="8px"
        py="2"
        px="2"
        maxWidth="540px"
        backgroundColor={theme.colors.accentPrimary}
        style={{ boxShadow: theme.shadows.cardInteractive }}
      >
        <Shelf gap="1">
          <Text color={theme.colors.textInverted} variant="heading5">
            {title}
          </Text>
          <Button
            variant="tertiary"
            small
            icon={<IconX size={24} height="24px" color={theme.colors.textInverted} />}
            onClick={props.onClose}
            style={{ marginLeft: 'auto' }}
          />
        </Shelf>
        <Text variant="body1" color={theme.colors.textInverted} style={{ paddingRight: '12px' }}>
          {children}
        </Text>
      </Stack>
    </Shelf>
  ) : null
}
