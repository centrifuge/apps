import { Box } from 'grommet'
import { StyledRadioButton } from 'grommet/components/RadioButton/RadioButton'
import { StyledSelect } from 'grommet/components/Select/StyledSelect'
import { StyledTextArea } from 'grommet/components/TextArea/StyledTextArea'
import { StyledTextInput } from 'grommet/components/TextInput/StyledTextInput'
import styled from 'styled-components'

export const ViewModeFormContainer = styled(Box)<{ isViewMode?: boolean }>`
  ${StyledTextInput}, ${StyledTextArea}, input[type="text"], textarea, ${StyledSelect} button {
    ${(props) => {
      if (props.isViewMode)
        return `svg {
          opacity: 0;
        }
      cursor:default;
      opacity: 1;`
    }}
  }
  // Components that can have a svg inside and we do not want to mess with its opacity
  ${StyledRadioButton} label {
    ${(props) => {
      if (props.isViewMode)
        return `
          cursor:default;
          opacity: 1;`
    }}
  }
`
