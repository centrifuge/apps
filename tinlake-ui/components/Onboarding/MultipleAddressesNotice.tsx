import * as React from 'react'
import { ExplainerCard } from '../../containers/Investment/View/styles'

interface Props {
  linkedAddresses: string[]
  connectedAddress: string
}

export const MultipleAddressesNotice: React.FC<Props> = ({ linkedAddresses, connectedAddress }) => {
  return (
    <ExplainerCard gap="xsmall">
      <strong>Multiple Ethereum addresses to Securitize account</strong>
      {linkedAddresses.map((addr) => (
        <React.Fragment key={addr}>
          {addr}
          <br />
        </React.Fragment>
      ))}
      {connectedAddress} (connected)
    </ExplainerCard>
  )
}
