import { Component } from 'react';
import { Box, Select, Text } from 'grommet';
import { Alert } from 'grommet-icons';
import React from 'react';
import { FieldRenderProps } from 'react-final-form';

export interface SearchableDropdownItem {
  label: string;
  value: string;
}

interface SearchableDropdownState {
  items: SearchableDropdownItem[];
  selected: SearchableDropdownItem | SearchableDropdownItem[];
}

const errorColor = 'red';

export default class SearchableDropdown<
  SearchableDropdownItem
> extends Component<
  FieldRenderProps & {
    items: any[];
    multiple?: boolean;
    label: string;
    meta?: any;
  },
  SearchableDropdownState
> {
  constructor(props) {
    super(props);
    this.state = {
      items: props.items,
      selected: props.multiple ? [] : { label: '', value: '' },
    };
  }

  onChange = change => {
    this.setState({ selected: change.value }, () => {
      this.props.input.onChange(
        Array.isArray(this.state.selected)
          ? this.state.selected.map(opt => opt.value)
          : this.state.selected.value,
      );
    });
  };

  onSearch = text => {
    const exp = new RegExp(text, 'i');
    this.setState({
      /// @ts-ignore - https://github.com/final-form/react-final-form/issues/398
      items: this.props.items.filter(o => exp.test(o.label)),
    });
  };

  render() {
    return (
      <Box gap="small" fill>
        <Box direction="row">
          <Text weight="bold" size="small">
            {this.props.label}
          </Text>
          {this.props.meta.error && this.props.meta.touched && (
            <Box direction="row" align="center" gap="xsmall">
              <Alert color={errorColor} size="small" />
              <Text size="xsmall" color={errorColor}>
                {this.props.meta.error}
              </Text>
            </Box>
          )}
        </Box>
        <Select
          multiple={this.props.multiple}
          size={"medium" as any}
          placeholder="Select"
          options={this.state.items}
          value={this.state.selected as any}
          labelKey="label"
          valueKey="value"
          onChange={this.onChange}
          onSearch={this.onSearch}
        />
      </Box>
    );
  }
}
