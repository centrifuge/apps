import { Box } from '@centrifuge/fabric'

type Props = {
  verificationURL: string
}

export const IdentityVerification = ({ verificationURL }: Props) => (
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
