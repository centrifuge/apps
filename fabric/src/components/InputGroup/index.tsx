import * as React from 'react'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type InputGroupProps = { label?: string; disabled?: boolean; errorMessage?: string }

export const InputGroup: React.FC<InputGroupProps> = ({ label, disabled, errorMessage, children }) => {
  return (
    <Stack gap={1}>
      {label && (
        <Text variant="label2" color={disabled ? 'textDisabled' : errorMessage ? 'statusCritical' : 'textSecondary'}>
          {label}
        </Text>
      )}
      <Shelf flexDirection={['column', 'row']} flexWrap="wrap" gap={3} rowGap={1} alignItems="flex-start">
        {children}
      </Shelf>
      {errorMessage && (
        <Text variant="label2" color="statusCritical">
          {errorMessage}
        </Text>
      )}
    </Stack>
  )
}
