import React, { Component } from 'react';
import { Box, Select, SelectProps, Text } from 'grommet';
import { Omit } from 'grommet/utils';
import { Close } from 'grommet-icons';


interface MutipleSelectState {
  options: any[];
  selected: any[];
}

interface MutipleSelectProps extends Omit<SelectProps, 'selected'> {
  options: any[];
  selected?: any[];
  search?: boolean
}


export default class MutipleSelect extends Component<MutipleSelectProps,
  MutipleSelectState> {
  constructor(props) {
    super(props);

    this.state = {
      options: props.options,
      selected: props.selected || [],
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ options: nextProps.options });
  }

  onChange = selected => {
    this.setState(
      {
        selected: selected,
        options: this.props.options,

      },
      () => {
        this.props.onChange && this.props.onChange(
          this.state.selected,
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


  getItemValue = (value) => {
    return this.getItemPropByKey(value, 'valueKey');
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

  renderSelectedItems = () => {
    return (
      <Box
        {...(this.state.selected.length < 1 && { height: 'xxsmall' })}
        wrap={true}
        direction={'row'}
        pad={{ vertical: 'xsmall' }}
      >
        {
          this.state.selected.map(
            (item: any, index) => (
              <Box
                key={index}
                //TODO fix the hardcoded values when moving to axis
                margin={{ vertical: '5px', 'right': 'xsmall' }}
                pad={{ vertical: 'xsmall', horizontal: 'xsmall' }}
                background={'light-4'}
                direction={'row'}
                align={'center'}
                round={'xsmall'}
                gap={'xsmall'}
              >
                <Text style={{ lineHeight: 1 }}>
                  {this.getItemLabel(item)}
                </Text>
                <Box onClick={
                  (ev) => {
                    ev.stopPropagation();
                    this.onChange(
                      this.state.selected.filter((selected: any) => {
                          return this.getItemValue(selected) !== this.getItemValue(item);
                        },
                      ),
                    );

                  }}>
                  <Close size={'small'}
                  />
                </Box>
              </Box>
            ),
          )
        }

      </Box>
    );
  };


  render() {

    const { search, ...rest } = this.props;

    if (search) {
      rest.onSearch = this.onSearch;
    }

    // delete props that we do not want to pass down
    delete rest.onChange;
    delete rest.multiple;
    delete rest.selected;
    delete rest.options;

    return (
      <Select
        multiple={true}
        size={'medium'}
        placeholder="Select"
        options={this.state.options}
        value={this.state.selected}
        valueLabel={this.renderSelectedItems()}
        onChange={(ev) => {
          this.onChange(ev.value);
        }}
        {...rest}
      />
    );
  }
}
