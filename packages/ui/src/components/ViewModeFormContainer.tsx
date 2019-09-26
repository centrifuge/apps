import { Box } from 'grommet';
import { StyledTextInput } from 'grommet/components/TextInput/StyledTextInput';
import { StyledTextArea } from 'grommet/components/TextArea/StyledTextArea';
import { StyledSelect } from 'grommet/components/Select/StyledSelect';
import styled from 'styled-components';

export const ViewModeFormContainer = styled(Box)`
 ${StyledTextInput}, ${StyledTextArea}, input[type="text"], textarea, ${StyledSelect} button {
       ${props => {
          if (props.isViewMode)
            return ` 
            svg {
              opacity: 0;
            }
            cursor:default;
            opacity: 1;`;
        }}
  }  
 `;
