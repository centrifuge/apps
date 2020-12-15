import { Modal } from '@centrifuge/axis-modal'
import styled from 'styled-components'

export const FormModal = styled(Modal)`
  max-height: 100%;
  overflow-y: auto;

  > div > h4 {
    margin: 0 auto 12px auto;
  }
`

export const InvestmentSteps = styled.img`
  display: block;
  width: 80%;
  margin: 20px auto;
`
