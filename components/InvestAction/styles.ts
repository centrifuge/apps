import { FormField } from 'grommet'
import styled from 'styled-components'

export const InvestmentSteps = styled.img`
  display: block;
  max-width: 600px;
  margin: 20px auto;
`

export const FormFieldWithoutBorder = styled(FormField)`
  > div {
    border-bottom-color: rgba(0, 0, 0, 0);
  }
`
