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
  labelInline?: boolean;
}

const errorColor = 'red';

const StyledTextInput = ({
  input,
  meta,
  placeholder,
  label,
  description,
  type,
  labelInline,
}: StyledTextInputProps) => (
  <Box gap="small" fill direction={labelInline ? 'row' : 'column'}>
    {label && (
      <Box direction="row" align="center" gap="xsmall">
        <Text weight="bold" size="small" margin={{ right: 'xsmall' }}>
          {label}
        </Text>
        {description && <Text size="small">{description}</Text>}
        {!labelInline && meta.error && meta.touched && (
          <Box direction="row" align="center" gap="xsmall">
            <Alert color={errorColor} size="small" />
            <Text size="xsmall" color={errorColor}>
              {meta.error}
            </Text>
          </Box>
        )}
      </Box>
    )}
    <Box fill>
      <TextInput
        {...input}
        placeholder={placeholder}
        type={type}
        style={{
          borderColor: meta.error && meta.touched ? errorColor : undefined,
        }}
      />
      {labelInline && meta.error && meta.touched && (
        <Box direction="row" align="center" gap="xsmall">
          <Alert color={errorColor} size="small" />
          <Text size="xsmall" color={errorColor}>
            {meta.error}
          </Text>
        </Box>
      )}
    </Box>
  </Box>
);

StyledTextInput.displayName = 'StyledTextInput';

export default StyledTextInput;
