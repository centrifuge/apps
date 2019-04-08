import React, { Component } from 'react';
import { Select, SelectProps } from 'grommet';
import { Omit } from 'grommet/utils';

export interface SearchSelectItem {
  label: string;
  value: string;
}

interface SearchSelectState {
  items: SearchSelectItem[];
  selected: SearchSelectItem | SearchSelectItem[];
}

interface SearchSelectProps extends Omit<SelectProps,"selected">{
  items: any[];
  label: string;
  selected?: SearchSelectItem | SearchSelectItem[];
}


export default class SearchSelect<SearchSelectItem> extends Component<
  SearchSelectProps,
  SearchSelectState> {
  constructor(props) {
    super(props);
    this.state = {
      items: props.items,
      selected:
        props.selected || (props.multiple ? [] : { label: '', value: '' }),
    };
  }

  onChange = change => {
    this.setState({ selected: change.value }, () => {
      this.props.onChange && this.props.onChange(
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
      <Select
        plain
        size={'medium'}
        placeholder="Select"
        options={this.state.items}
        value={this.state.selected}
        labelKey="label"
        valueKey="value"
        onChange={this.onChange}
        onSearch={this.onSearch}
      />
    );
  }
}
