import { truncateAddress } from '@centrifuge/centrifuge-react'
import { IconCheckCircle, IconCopy, Shelf, Text } from '@centrifuge/fabric'
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

export const CopyToClipboard = ({ address }: { address: string }) => {
  const [copied, setCopied] = React.useState(false)
  return (
    <CopyButton
      onClick={() => {
        setTimeout(() => setCopied(true), 100)
        setTimeout(() => setCopied(false), 1100)
        copyToClipboard(address)
      }}
      title="Copy to clipboard"
    >
      <Shelf gap={1} style={{ cursor: 'copy' }}>
        <Text variant="body2">{truncateAddress(address)}</Text>
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
