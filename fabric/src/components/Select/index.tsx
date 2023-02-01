import * as React from 'react'
import styled from 'styled-components'
import { IconChevronDown } from '../..'
import { Box } from '../Box'
import { InputBox } from '../InputBox'
import { Stack } from '../Stack'
import { Text } from '../Text'

type OnSelectCallback = (key?: string | number) => void

export type SelectOptionItem = {
  label: string
  value: string
}

export type SelectProps = {
  options: SelectOptionItem[]
  name?: string
  id?: string
  onSelect?: OnSelectCallback
  onBlur?: (e: React.FocusEvent) => void
  value?: string
  label?: string | React.ReactElement
  placeholder: string
  disabled?: boolean
  errorMessage?: string
}

const StyledSelect = styled.select`
  appearance: none;
  background-color: transparent;
  border: none;
  padding: 0 1em 0 0;
  margin: 0;
  width: 100%;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  line-height: inherit;
  text-overflow: ellipsis;

  &:disabled {
    cursor: default;
  }

  &:focus {
    color: ${({ theme }) => theme.colors.textSelected};
  }
`

export const Select: React.FC<SelectProps> = ({
  options,
  name,
  id,
  onSelect,
  onBlur,
  label,
  placeholder,
  value,
  disabled,
  errorMessage,
}) => {
  const [selected, setSelected] = React.useState(value ?? '')

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelected(event.target.value)

    if (onSelect) {
      onSelect(event.target.value)
    }
  }

  return (
    <Stack gap={1} width="100%">
      <InputBox
        width="100%"
        label={label}
        as="div"
        disabled={disabled}
        inputElement={
          <StyledSelect
            id={id ?? ''}
            name={name ?? ''}
            value={selected}
            disabled={disabled}
            onChange={handleChange}
            onBlur={onBlur}
          >
            <option value="">{placeholder}</option>
            {options.map((option, index) => (
              <option key={`${index}${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </StyledSelect>
        }
        rightElement={<IconChevronDown color={disabled ? 'textSecondary' : 'textPrimary'} />}
      />
      {errorMessage && (
        <Box px={2}>
          <Text variant="label2" color="statusCritical">
            {errorMessage}
          </Text>
        </Box>
      )}
    </Stack>
  )
}
