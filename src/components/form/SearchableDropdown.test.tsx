import React from 'react';
import { shallow, mount } from 'enzyme';
import SearchableDropdown from './SearchableDropdown';

describe('Searchable dropdown', () => {
  const inputProps = {
    name: 'dropdown',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    value: undefined,
  };

  const items = [
    {
      label: 'water',
      value: 'h20',
    },
    {
      label: 'coffee',
      value: 'COFFEE',
    },
    {
      label: 'cola',
      value: 'COLA',
    },
  ];

  let searchableDropdownShallow;

  beforeEach(() => {
    searchableDropdownShallow = shallow(
      <SearchableDropdown input={inputProps} meta={{}} items={items} />,
    );

    ['onBlur', 'onChange', 'onFocus'].forEach(cb => inputProps[cb].mockClear());
  });

  it('should match snapshot', () => {
    expect(searchableDropdownShallow).toMatchSnapshot();
  });

  it('should initialize the state', function() {
    const state = searchableDropdownShallow.state();
    expect(state.items).toBe(items);
    expect(state.selectedItem).toEqual({ label: '', value: '' });
  });

  describe('onChange', () => {
    it('should update the state and invoke the onchange input prop', function() {
      const instance = searchableDropdownShallow.instance();
      const orangeJuice = {
        value: 'OJ',
        label: 'orange juice',
      };

      instance.onChange({
        option: orangeJuice,
      });

      const updatedState = searchableDropdownShallow.state();
      expect(updatedState.selectedItem).toEqual(orangeJuice);
      expect(inputProps.onChange).toHaveBeenCalledWith(orangeJuice.value);
    });
  });

  describe('onSearch', () => {
    describe('when search string partially matches a label', () => {
      it('should return the matching items', function() {
        const instance = searchableDropdownShallow.instance();
        instance.onSearch('co');

        const state = searchableDropdownShallow.state();
        expect(state.items.length).toBe(2);
        expect(state.items).toEqual(items.slice(1));
      });
    });

    describe('when search string does not match a label', () => {
      it('should return an empty array', function() {
        const instance = searchableDropdownShallow.instance();
        instance.onSearch('non matching search string');

        const state = searchableDropdownShallow.state();
        expect(state.items.length).toBe(0);
      });
    });
  });
});
