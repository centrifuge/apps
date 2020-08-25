import { FormField, Button } from 'grommet'
import styled from 'styled-components'

import { Modal } from '@centrifuge/axis-modal'
import Alert from '../Alert'

export const FormModal = styled(Modal)`
  max-height: 100%;
  overflow-y: auto;
`

export const InvestmentSteps = styled.img`
  display: block;
  width: 80%;
  margin: 20px auto;
`

export const FormFieldWithoutBorder = styled(FormField)`
  > div {
    border-bottom-color: rgba(0, 0, 0, 0);
  }
`

export const AcceptButton = styled(Button)`
  min-height: 38px;
`

export const ErrorMessage = styled(Alert)`
  margin-bottom: 12px;
  padding: 12px 16px;
  display: block;
`
