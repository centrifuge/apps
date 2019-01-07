import { Component } from 'react';
import { Box, Select, Text } from 'grommet';
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

export default class SearchableDropdown<
  SearchableDropdownItem
> extends Component<
  FieldRenderProps & { items: any[]; multiple?: boolean; label: string },
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
        <label>
          <Text weight="bold" size="small">
            {this.props.label}
          </Text>
        </label>
        <Select
          multiple={this.props.multiple}
          size="medium"
          placeholder="Select"
          options={this.state.items}
          value={this.state.selected}
          labelKey="label"
          valueKey="value"
          onChange={this.onChange}
          onSearch={this.onSearch}
        />
      </Box>
    );
  }
}
