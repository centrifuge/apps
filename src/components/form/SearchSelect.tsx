import React, { Component } from 'react';
import { Select, SelectProps } from 'grommet';
import { Omit } from 'grommet/utils';

export interface SearchSelectItem {
  label: string;
  value: string;
}

interface SearchSelectState {
  options: SearchSelectItem[];
  selected: SearchSelectItem | SearchSelectItem[];
}

interface SearchSelectProps extends Omit<SelectProps,"selected">{
  options: any[];
  selected?: SearchSelectItem | SearchSelectItem[];
}


export default class SearchSelect<SearchSelectItem> extends Component<
  SearchSelectProps,
  SearchSelectState> {
  constructor(props) {
    super(props);
    this.state = {
      options: props.options,
      selected:
        props.selected || (props.multiple ? [] : { label: '', value: '' }),
    };
  }

  onChange = event => {
    this.setState({ selected: event.value }, () => {
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
      options: this.props.options.filter(o => exp.test(o.label)),
    });
  };

  render() {
    return (
      <Select
        plain
        size={'medium'}
        placeholder="Select"
        options={this.state.options}
        value={this.state.selected}
        labelKey="label"
        valueKey="value"
        onChange={this.onChange}
        onSearch={this.onSearch}
      />
    );
  }
}
