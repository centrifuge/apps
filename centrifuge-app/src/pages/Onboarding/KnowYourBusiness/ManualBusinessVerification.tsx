import { Box } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  verificationURL: string
}

export const ManualBusinessVerification = ({ verificationURL }: Props) => {
  return (
    <Box height="100%">
      <iframe
        dataset-removable="true"
        name="shuftipro-iframe"
        id="shuftipro-iframe"
        src={verificationURL}
        title="shufti-pro-identity-verification"
        allow="camera"
        width="100%"
        height="100%"
        style={{
          border: 'none',
        }}
      />
    </Box>
  )
}
