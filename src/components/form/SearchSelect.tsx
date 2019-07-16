import React, { Component } from 'react';
import { Select, SelectProps } from 'grommet';

// TODO add this to Axis
interface SearchSelectState {
  options: any[];
}

interface SearchSelectProps extends SelectProps {
  options: any[];
}


export class SearchSelect extends Component<SearchSelectProps,
  SearchSelectState> {
  constructor(props) {
    super(props);
    this.state = {
      options: props.options,
    };
  }

  componentWillReceiveProps(nextProps) {
      this.setState({ options: nextProps.options });
  }

  onChange = selected => {
    this.setState(
      {
        options: this.props.options,
      },
      () => {
        this.props.onChange && this.props.onChange(
          selected.value,
        );
      });
  };


  onSearch = text => {
    const exp = new RegExp(text, 'i');
    this.setState({
      options: this.props.options.filter(o => {
        return exp.test(this.getItemLabel(o));
      }),
    });
  };


  getItemLabel = (value) => {
    return this.getItemPropByKey(value, 'labelKey');
  };


  getItemPropByKey = (value, key) => {
    const prop = this.props[key];
    if (!prop) {
      return value;
    } else {
      if (typeof prop === 'function') {
        return prop(value);
      } else {
        return value[prop];
      }
    }
  };

  render() {

    const props = { ...this.props };
    props.onSearch = this.onSearch;
    // delete props that we do not want to pass down
    delete props.onChange;
    delete props.multiple;
    delete props.options;

    return (
      <Select
        plain
        size={'medium'}
        placeholder="Select"
        options={this.state.options}
        onChange={this.onChange}
        onSearch={this.onSearch}
        {...props}
      />
    );
  }
}


export default SearchSelect;
