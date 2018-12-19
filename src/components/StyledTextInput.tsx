import { Box, TextInput } from 'grommet';
import React from 'react';

const StyledTextInput = ({ input, meta, placeholder, label }) => (
  <Box fill="true">
    <label>{label}</label>
    <Box background="white">
      <TextInput {...input} placeholder={placeholder} />
    </Box>
    {meta.error && meta.touched && <span>{meta.error}</span>}
  </Box>
);

StyledTextInput.displayName = 'StyledTextInput';

export default StyledTextInput;
