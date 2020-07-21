import * as React from 'react'
import { FormField, TextInput } from 'grommet'
import NumberInput from '../NumberInput'
import { baseToDisplay, bnToHex } from 'tinlake'
import { convert as convertToTimestamp } from './../../utils/timestampConverter'
const web3 = require('web3-utils')

interface DisplayedFieldBase {
  key: string
  label: string
}

interface DisplayedFieldUint extends DisplayedFieldBase {
  type: 'uint'
  decimals?: number
  precision?: number
  suffix?: string
}

interface DisplayedFieldAddress extends DisplayedFieldBase {
  type: 'address'
}

interface DisplayedFieldTimestamp extends DisplayedFieldBase {
  type: 'timestamp'
  decimals?: number
  precision?: number
  suffix?: string
}

interface DisplayedFieldString extends DisplayedFieldBase {
  type: 'string'
}

interface DisplayedFieldUTF8String extends DisplayedFieldBase {
  type: 'utf8_string'
}

export type DisplayedField =
  | DisplayedFieldUint
  | DisplayedFieldAddress
  | DisplayedFieldTimestamp
  | DisplayedFieldString
  | DisplayedFieldUTF8String

interface Props {
  displayedField: DisplayedField
  value: any
}

class NftDataField extends React.Component<Props> {
  render() {
    const { displayedField: field, value } = this.props

    if (field.type === 'uint') {
      const { label, decimals, precision, suffix } = field
      if (!decimals || !precision) {
        return (
          <FormField label={label}>
            <NumberInput value={value.toNumber()} suffix={suffix} precision={0} disabled />
          </FormField>
        )
      }
      return (
        <FormField label={label}>
          <NumberInput value={baseToDisplay(value, decimals || 18)} suffix={suffix} precision={precision} disabled />
        </FormField>
      )
    }

    if (field.type === 'address') {
      const { label } = field

      return (
        <FormField label={label}>
          <TextInput value={value} disabled />
        </FormField>
      )
    }

    if (field.type === 'timestamp') {
      const { label } = field
      const bigIntToHex = bnToHex(value)
      const paddedHex = bigIntToHex.slice(2).padStart(24, '0')
      const unixTimestamp = convertToTimestamp(paddedHex)

      return (
        <FormField label={label}>
          <TextInput value={new Date(unixTimestamp).toString()} disabled />
        </FormField>
      )
    }

    if (field.type === 'string') {
      const { label } = field
      const msg = web3.hexToUtf8(bnToHex(value))
      return (
        <FormField label={label}>
          <TextInput value={msg} disabled />
        </FormField>
      )
    }

    if (field.type === 'utf8_string') {
      const { label } = field
      return (
        <FormField label={label}>
          <TextInput value={value} disabled />
        </FormField>
      )
    }

    throw new Error(`Unsupported type "${(field as any).type}" given to NftDataField`)
  }
}

export default NftDataField
