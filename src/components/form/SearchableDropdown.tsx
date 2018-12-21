import { Component } from 'react';
import { Select } from 'grommet';
import React from 'react';
import { FieldRenderProps } from 'react-final-form';

interface SearchableDropdownItem {
  label: string;
  value: string;
}

interface SearchableDropdownState {
  items: SearchableDropdownItem[];
  selectedItem: SearchableDropdownItem;
}

export default class SearchableDropdown<
  SearchableDropdownItem
> extends Component<
  FieldRenderProps & { items: any[] },
  SearchableDropdownState
> {
  constructor(props) {
    super(props);
    this.state = {
      items: props.items,
      selectedItem: { label: '', value: '' },
    };
  }

  onChange = change => {
    this.setState({ selectedItem: change.option }, () =>
      this.props.input.onChange(change.option.value),
    );
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
      <Select
        size="medium"
        placeholder="Select"
        options={this.state.items}
        value={this.state.selectedItem}
        labelKey="label"
        valueKey="value"
        onChange={this.onChange}
        onSearch={this.onSearch}
      />
    );
  }
}
