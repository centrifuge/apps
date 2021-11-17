import { Text, TextProps } from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/keyring'
import * as React from 'react'
import { useIdentity } from '../utils/useIdentity'
import { truncateAddress } from '../utils/web3'

type Props = TextProps & {
  address: string
  clickToCopy?: boolean
}

export const Identity: React.FC<Props> = ({ address, clickToCopy, ...textProps }) => {
  const { data: identity } = useIdentity(address)
  const addr = encodeAddress(address, 2)
  return (
    <Text
      {...textProps}
      title={addr}
      style={{ cursor: clickToCopy ? 'copy' : undefined }}
      onClick={clickToCopy ? () => copyToClipboard(addr) : undefined}
    >
      {identity?.display || truncateAddress(address)}
    </Text>
  )
}

function copyToClipboard(value: string) {
  if (window.navigator && window.navigator.clipboard) {
    window.navigator.clipboard.writeText(value)
    return
  }

  const textField = document.createElement('textarea')
  textField.innerText = value
  document.body.appendChild(textField)
  textField.select()
  document.execCommand('copy')
  textField.remove()
}
