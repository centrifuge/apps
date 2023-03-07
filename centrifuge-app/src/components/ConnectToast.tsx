import { Box, Toast } from '@centrifuge/fabric'
import styled from 'styled-components'

const ToastBox = styled(Box)`
  position: fixed;
  top: 80px;
  right: 40px;
`

export const ConnectToast = () => (
  <ToastBox>
    <Toast label="Please connect your wallet" status="warning" />
  </ToastBox>
)
