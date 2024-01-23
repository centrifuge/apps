import * as React from 'react'
import { InputUnit, InputUnitProps } from '../InputBox'
import { Shelf } from '../Shelf'

export type InputGroupProps = Omit<InputUnitProps, 'inputElement'> & { children: React.ReactNode }

export function InputGroup({ children, ...unitProps }: InputGroupProps) {
  return (
    <InputUnit
      {...unitProps}
      inputElement={
        <Shelf flexDirection={['column', 'row']} flexWrap="wrap" gap={3} rowGap={1} alignItems="flex-start">
          {children}
        </Shelf>
      }
    ></InputUnit>
  )
}
