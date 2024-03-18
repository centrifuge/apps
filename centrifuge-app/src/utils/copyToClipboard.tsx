import { truncateAddress } from '@centrifuge/centrifuge-react'
import { IconCheckCircle, IconCopy, Shelf, Text, TextVariantName } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

export function copyToClipboard(value: string) {
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

export const CopyToClipboard = ({ address, variant }: { address: string; variant?: TextVariantName }) => {
  const [copied, setCopied] = React.useState(false)
  return (
    <CopyButton
      onClick={() => {
        setTimeout(() => setCopied(true), 200)
        setTimeout(() => setCopied(false), 1100)
        copyToClipboard(address)
      }}
      title="Copy to clipboard"
    >
      <Shelf gap={1} style={{ cursor: 'copy' }}>
        <Text variant={variant ?? 'body2'}>{truncateAddress(address)}</Text>
        {copied ? <IconCheckCircle size="16px" /> : <IconCopy size="16px" />}
      </Shelf>
    </CopyButton>
  )
}

const CopyButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: copy;
`
