import { Box, TextInput, Text } from 'grommet';
import { Alert } from 'grommet-icons';
import React from 'react';

interface StyledTextInputProps {
  input;
  meta;
  placeholder?: string;
  label?: string;
  description?: string;
  type?: string;
}

const errorColor = 'red';

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
      <Box direction="row" align="center" gap="xsmall">
        <Text weight="bold" size="small" margin={{ right: 'xsmall' }}>
          {label}
        </Text>
        {description && <Text size="small">{description}</Text>}
        {meta.error && meta.touched && (
          <Box direction="row" align="center" gap="xsmall">
            <Alert color={errorColor} size="small" />
            <Text size="xsmall" color={errorColor}>
              {meta.error}
            </Text>
          </Box>
        )}
      </Box>
    )}
    <TextInput
      {...input}
      placeholder={placeholder}
      type={type}
      style={{
        borderColor: meta.error && meta.touched ? errorColor : undefined,
      }}
    />
  </Box>
);

StyledTextInput.displayName = 'StyledTextInput';

export default StyledTextInput;
