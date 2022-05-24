import { useButton } from '@react-aria/button'
import { FocusScope } from '@react-aria/focus'
import { AriaListBoxOptions, useListBox, useOption } from '@react-aria/listbox'
import { DismissButton, useOverlay } from '@react-aria/overlays'
import { AriaSelectOptions, HiddenSelect, useSelect } from '@react-aria/select'
import { Item } from '@react-stately/collections'
import { SelectState, useSelectState } from '@react-stately/select'
import { CollectionElement, Node } from '@react-types/shared'
import React, { FocusEvent } from 'react'
import styled from 'styled-components'
import { IconChevronDown, IconChevronUp } from '../..'
import { Box } from '../Box'
import { InputBox } from '../InputBox'
import { Stack } from '../Stack'
import { Text } from '../Text'

type PopoverProps = {
  isOpen: boolean
  onClose: () => void
}

type OptionProps = {
  state: SelectState<SelectOptionItem>
  item: Node<SelectOptionItem>
}

type OnSelectCallback = (key?: string | number) => void

interface SelectIntProps extends AriaSelectOptions<SelectOptionItem> {
  placeholder: string
  errorMessage?: string
}

export type SelectOptionItem = {
  label: string | React.ReactElement
  value: string
}

type SelectProps = {
  options: SelectOptionItem[]
  onSelect?: OnSelectCallback
  onBlur?: (e: FocusEvent) => void
  value?: string
  label: string | React.ReactElement
  placeholder: string
  disabled?: boolean
  errorMessage?: string
}

export const Select: React.FC<SelectProps> = ({
  options,
  onSelect,
  onBlur,
  label,
  placeholder,
  value,
  disabled,
  errorMessage,
}) => {
  const items: CollectionElement<SelectOptionItem>[] = options.map((opt) => {
    return (
      <Item key={opt.value} textValue={opt.value}>
        {opt.label}
      </Item>
    ) as CollectionElement<SelectOptionItem>
  })

  return (
    <SelectInputInt
      items={options}
      label={label}
      placeholder={placeholder}
      selectedKey={value}
      onSelectionChange={onSelect}
      isDisabled={disabled}
      errorMessage={errorMessage}
      onBlur={onBlur}
    >
      {items}
    </SelectInputInt>
  )
}

const SelectInputInt: React.FC<SelectIntProps> = (props) => {
  const state = useSelectState<SelectOptionItem>(props)
  const ref = React.useRef<HTMLButtonElement>(null)
  const { triggerProps, valueProps, menuProps } = useSelect(props, state, ref)
  const { buttonProps } = useButton(triggerProps, ref)
  const IconComp = state.isOpen ? IconChevronUp : IconChevronDown

  return (
    <Stack gap={1} width="100%">
      <Stack position="relative" width="100%">
        <StyledTrigger {...buttonProps} ref={ref}>
          <InputBox
            label={props.label}
            as="div"
            disabled={props.isDisabled}
            active={(state.isOpen || state.isFocused) && !props.isDisabled}
            inputElement={
              <Text
                color={
                  !state.selectedItem || props.isDisabled
                    ? 'textDisabled'
                    : state.isFocused
                    ? 'accentPrimary'
                    : 'textPrimary'
                }
                {...valueProps}
              >
                {state.selectedItem ? state.selectedItem.rendered : props.placeholder}
              </Text>
            }
            rightElement={
              <IconComp color={props.isDisabled ? 'textSecondary' : 'textPrimary'} style={{ margin: '-8px 0' }} />
            }
          />
        </StyledTrigger>
        <HiddenSelect state={state} triggerRef={ref} label={props.label} name={props.name} />

        {state.isOpen && (
          <Popover isOpen={state.isOpen} onClose={state.close}>
            <ListBox {...menuProps} state={state} />
          </Popover>
        )}
      </Stack>

      {props.errorMessage && (
        <Box px={2}>
          <Text variant="label2" color="statusCritical">
            {props.errorMessage}
          </Text>
        </Box>
      )}
    </Stack>
  )
}

const ListBox: React.FC<AriaListBoxOptions<unknown> & { state: SelectState<SelectOptionItem> }> = (props) => {
  const ref = React.useRef(null)
  const { state } = props
  const { listBoxProps } = useListBox(props, state, ref)

  return (
    <StyledListBox {...listBoxProps} ref={ref}>
      {[...state.collection].map((item) => (
        <Option key={item.key} item={item} state={state} />
      ))}
    </StyledListBox>
  )
}

const Option: React.FC<OptionProps> = ({ item, state }) => {
  const ref = React.useRef<HTMLLIElement>(null)
  const { optionProps, isSelected, isFocused, isDisabled } = useOption({ key: item.key }, state, ref)

  const statusProps = { isSelected, isFocused, isDisabled }

  return (
    <StyledOption {...optionProps} {...statusProps} ref={ref}>
      <StyledOptionText variant="body1" {...statusProps}>
        {item.rendered}
      </StyledOptionText>
    </StyledOption>
  )
}

const Popover: React.FC<PopoverProps> = (props) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const { isOpen, onClose, children } = props

  const { overlayProps } = useOverlay(
    {
      isOpen,
      onClose,
      shouldCloseOnBlur: true,
      isDismissable: true,
    },
    ref
  )

  // Add a hidden <DismissButton> component at the end of the popover
  // to allow screen reader users to dismiss the popup easily.
  return (
    <FocusScope restoreFocus>
      <StyledPopover {...overlayProps} ref={ref}>
        {children}
        <DismissButton onDismiss={onClose} />
      </StyledPopover>
    </FocusScope>
  )
}

// Styles

const StyledTrigger = styled.button`
  display: flex;
  width: 100%;
  padding: 0;
  appearance: none;
  background: transparent;
  border: none;
  text-align: left;
`

const StyledPopover = styled.div`
  position: absolute;
  top: 100%;
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundInput};
  border-radius: ${({ theme }) => theme.radii.input}px;
  overflow: hidden;
  z-index: 20;
`

// TODO Configure maxHeight and overflow via props
const StyledListBox = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 162px;
  overflow: auto;
`

const StyledOption = styled.li<{ isSelected: boolean; isFocused: boolean; isDisabled: boolean }>`
  box-sizing: border-box;
  background: ${({ theme, isFocused, isDisabled }) => {
    if (isFocused) return '#EDF2FF'
    if (isDisabled) return theme.colors.backgroundSecondary
    return theme.colors.backgroundInput
  }};
  cursor: pointer;
  outline: none;
  padding: 16px;
`

const StyledOptionText = styled(Text)<{ isSelected: boolean; isFocused: boolean; isDisabled: boolean }>`
  color: ${({ theme, isDisabled }) => {
    if (isDisabled) return theme.colors.textDisabled
    return theme.colors.textPrimary
  }} !important;
`
