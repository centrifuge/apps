import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { TextInput, TextInputProps } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import { FieldAttributes, useField } from 'formik'
import React from 'react'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { isEvmAddress } from '../../../src/utils/address'
import { truncate } from '../../utils/web3'

type FormAddressInputProps = {
  name: string
  chainId?: number
} & TextInputProps &
  FieldAttributes<any>

export const FormAddressInput = ({ name, chainId, placeholder, ...props }: FormAddressInputProps) => {
  const [field, meta, helpers] = useField(name)
  const utils = useCentrifugeUtils()

  let truncated: string | undefined
  try {
    truncated = truncate(utils.formatAddress(field.value))
  } catch (e) {
    truncated = undefined
  }

  function handleBlur() {
    helpers.setTouched(true)

    if (!truncated || meta.error) {
      helpers.setError('Invalid address')
      return
    }

    helpers.setValue(isEvmAddress(field.value) ? evmToSubstrateAddress(field.value, chainId ?? 0) : field.value)
  }

  return (
    <FieldWithErrorMessage
      {...field}
      placeholder={placeholder ?? 'Enter address...'}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => helpers.setValue(e.target.value)}
      onBlur={handleBlur}
      errorMessage={meta.touched && meta.error ? meta.error : undefined}
      as={TextInput}
      {...props}
      value={isEvmAddress(field.value) || isAddress(field.value) ? utils.formatAddress(field.value) : field.value}
    />
  )
}
