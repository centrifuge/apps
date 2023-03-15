import { Stack } from '@centrifuge/fabric'
import * as React from 'react'

type NotificationBarProps = {
  children: React.ReactNode
}

export function NotificationBar({ children }: NotificationBarProps) {
  return (
    <Stack role="alert" gap={1} maxWidth={640} mb={-2}>
      {children}
    </Stack>
  )
}
