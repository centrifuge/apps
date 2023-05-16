import { Box, Toast } from '@centrifuge/fabric'
import styled from 'styled-components'

const ToastBox = styled(Box)`
  position: fixed;
  top: 30px;
  width: fit-content;
  left: 50%;
  transform: translateX(-50%);
`

export const ValidationToast = ({ label }: { label: string }) => (
  <ToastBox>
    <Toast label={label} status="warning" />
  </ToastBox>
)
