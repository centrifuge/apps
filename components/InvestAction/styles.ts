import { FormField, Button } from 'grommet'
import styled from 'styled-components'

import { Modal } from '@centrifuge/axis-modal'

export const FormModal = styled(Modal)`
  max-height: 100%;
  overflow-y: scroll;
`

export const InvestmentSteps = styled.img`
  display: block;
  width: 100%;
  margin: 20px 0;
`

export const FormFieldWithoutBorder = styled(FormField)`
  > div {
    border-bottom-color: rgba(0, 0, 0, 0);
  }
`

export const AcceptButton = styled(Button)`
  min-height: 38px;
`
