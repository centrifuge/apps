import { Box, TextInput, Text } from 'grommet';
import React from 'react';

interface StyledTextInputProps {
  input;
  meta;
  placeholder?: string;
  label?: string;
  description?: string;
  type?: string;
}

const StyledTextInput = ({
  input,
  meta,
  placeholder,
  label,
  description,
  type,
}: StyledTextInputProps) => (
  <Box gap="small" fill>
    {label && (
      <Box direction="row">
        <Text weight="bold" size="small" margin={{ right: 'xsmall' }}>
          {label}
        </Text>
        {description && <Text size="small">{description}</Text>}
      </Box>
    )}
    <TextInput {...input} placeholder={placeholder} type={type} />
    {meta.error && meta.touched && <span>{meta.error}</span>}
  </Box>
);

StyledTextInput.displayName = 'StyledTextInput';

export default StyledTextInput;
