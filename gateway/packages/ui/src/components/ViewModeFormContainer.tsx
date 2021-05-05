import { Box } from 'grommet';
import { StyledTextInput } from 'grommet/components/TextInput/StyledTextInput';
import { StyledTextArea } from 'grommet/components/TextArea/StyledTextArea';
import { StyledSelect } from 'grommet/components/Select/StyledSelect';
import { StyledRadioButton } from 'grommet/components/RadioButton/RadioButton';
import styled from 'styled-components';

export const ViewModeFormContainer = styled(Box)`
 ${StyledTextInput}, ${StyledTextArea}, input[type="text"], textarea, ${StyledSelect} button {
       ${props => {
          if (props.isViewMode)
            return `svg {
                      opacity: 0;
                    }
                    cursor:default;
                    opacity: 1;`;
        }}
  }  
   // Components that can have a svg inside and we do not want to mess with its opacity
   ${StyledRadioButton} label {
       ${props => {
          if (props.isViewMode)
            return `cursor:default;
                    opacity: 1;`;
        }}
  } 
 `;
