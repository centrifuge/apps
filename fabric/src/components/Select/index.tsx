import { useButton } from '@react-aria/button'
import { FocusScope } from '@react-aria/focus'
import { AriaListBoxOptions, useListBox, useOption } from '@react-aria/listbox'
import { DismissButton, useOverlay } from '@react-aria/overlays'
import { AriaSelectOptions, HiddenSelect, useSelect } from '@react-aria/select'
import { Item } from '@react-stately/collections'
import { SelectState, useSelectState } from '@react-stately/select'
import { CollectionElement, Node } from '@react-types/shared'
import React from 'react'
import styled from 'styled-components'
import { IconChevronDown, IconChevronUp } from '../..'
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
}

export type SelectOptionItem = {
  label: string | React.ReactElement
  value: string
}

type SelectProps = {
  options: SelectOptionItem[]
  onSelect?: OnSelectCallback
  value?: string
  label: string
  placeholder: string
  disabled?: boolean
}

export const Select: React.FC<SelectProps> = ({ options, onSelect, label, placeholder, value, disabled }) => {
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
    >
      {items}
    </SelectInputInt>
  )
}

const SelectInputInt: React.FC<SelectIntProps> = (props) => {
  const state = useSelectState<SelectOptionItem>(props)
  const ref = React.useRef<HTMLButtonElement>(null)
  const { labelProps, triggerProps, valueProps, menuProps } = useSelect(props, state, ref)
  const { buttonProps } = useButton(triggerProps, ref)

  return (
    <StyledSelect>
      <Text as="label" variant="label1" {...labelProps}>
        {props.label}
      </Text>
      <HiddenSelect state={state} triggerRef={ref} label={props.label} name={props.name} />
      <StyledTrigger {...buttonProps} ref={ref}>
        <StyledTriggerText variant="body2" isPlaceholder={!state.selectedItem} {...valueProps}>
          {state.selectedItem ? state.selectedItem.rendered : props.placeholder}
        </StyledTriggerText>
        {state.isOpen ? <IconChevronUp color="textPrimary" /> : <IconChevronDown color="textPrimary" />}
      </StyledTrigger>
      {state.isOpen && (
        <Popover isOpen={state.isOpen} onClose={state.close}>
          <ListBox {...menuProps} state={state} />
        </Popover>
      )}
    </StyledSelect>
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
const StyledSelect = styled.div`
  display: inline-block;
  position: relative;
  width: 100%;
`

const StyledTrigger = styled.button<{ isPlaceholder: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  appearance: none;
  background: transparent;
  color: red;
  border: none;

  border-bottom: 1px solid ${({ theme }) => theme.colors.textPrimary};
  width: 100%;
  text-align: left;
  padding-bottom: 4px;
  margin-top: 4px;
`

const StyledTriggerText = styled(Text)<{ isPlaceholder: boolean }>`
  color: ${({ theme, isPlaceholder }) =>
    isPlaceholder ? theme.colors.textDisabled : theme.colors.textPrimary} !important;
`

const StyledPopover = styled.div`
  position: absolute;
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundPrimary};
  border-radius: ${({ theme }) => theme.space[1]}px;
  box-shadow: ${({ theme }) => theme.shadows.cardInteractive};
  overflow: hidden;
  z-index: 20;
`

// TODO Configure maxHeight and overflow via props
const StyledListBox = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 150px;
  overflow: auto;
`

const StyledOption = styled.li<{ isSelected: boolean; isFocused: boolean; isDisabled: boolean }>`
  background: ${({ theme }) => theme.colors.backgroundPrimary};
  color: ${({ theme, isSelected, isDisabled }) => {
    if (isSelected) return theme.colors.brand
    if (isDisabled) return theme.colors.textDisabled
    return theme.colors.textPrimary
  }} !important;
  cursor: pointer;
  outline: 'none';
  padding: 8px 16px;
`

const StyledOptionText = styled(Text)<{ isSelected: boolean; isFocused: boolean; isDisabled: boolean }>`
  color: ${({ theme, isSelected, isDisabled }) => {
    if (isSelected) return theme.colors.brand
    if (isDisabled) return theme.colors.textDisabled
    return theme.colors.textPrimary
  }} !important;
`
