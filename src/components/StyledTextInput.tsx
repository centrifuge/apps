import { Box, TextInput } from 'grommet';
import React from 'react';

interface StyledTextInputProps {
  input;
  meta;
  placeholder: string;
  label?: string;
}

const StyledTextInput = ({ input, meta, placeholder, label }: StyledTextInputProps) => (
  <Box fill>
    {label && <label>{label}</label>}
    <Box background="white">
      <TextInput {...input} placeholder={placeholder} />
    </Box>
    {meta.error && meta.touched && <span>{meta.error}</span>}
  </Box>
);

StyledTextInput.displayName = 'StyledTextInput';

export default StyledTextInput;
