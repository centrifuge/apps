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

  describe('when single item select', () => {
    let searchableDropdownShallow;

    beforeEach(() => {
      searchableDropdownShallow = shallow(
        <SearchableDropdown
          label="Some field"
          input={inputProps}
          meta={{}}
          items={items}
        />,
      );

      ['onBlur', 'onChange', 'onFocus'].forEach(cb =>
        inputProps[cb].mockClear(),
      );
    });

    it('should match snapshot', () => {
      expect(searchableDropdownShallow).toMatchSnapshot();
    });

    it('should initialize the state', function() {
      const state = searchableDropdownShallow.state();
      expect(state.items).toBe(items);
      expect(state.selected).toEqual({ label: '', value: '' });
    });

    describe('onChange', () => {
      it('should update the state and invoke the onchange input prop', function() {
        const instance = searchableDropdownShallow.instance();
        const orangeJuice = {
          value: 'OJ',
          label: 'orange juice',
        };

        instance.onChange({
          value: orangeJuice,
        });

        const updatedState = searchableDropdownShallow.state();
        expect(updatedState.selected).toEqual(orangeJuice);
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

  describe('when multiple item select', () => {
    let searchableDropdownShallow;

    beforeEach(() => {
      searchableDropdownShallow = shallow(
        <SearchableDropdown
          multiple={true}
          label="Some multiple select field"
          input={inputProps}
          meta={{}}
          items={items}
        />,
      );

      ['onBlur', 'onChange', 'onFocus'].forEach(cb =>
        inputProps[cb].mockClear(),
      );
    });

    it('should match snapshot', () => {
      expect(searchableDropdownShallow).toMatchSnapshot();
    });

    it('should initialize the state', function() {
      const state = searchableDropdownShallow.state();
      expect(state.items).toBe(items);
      expect(state.selected).toEqual([]);
    });

    describe('onChange', () => {
      it('should update the state and invoke the onchange input prop', function() {
        const instance = searchableDropdownShallow.instance();
        const selectedItems = [
          {
            value: 'OJ',
            label: 'orange juice',
          },
          { value: 'MK', label: 'milk' },
        ];

        instance.onChange({
          value: selectedItems,
        });

        const updatedState = searchableDropdownShallow.state();
        expect(updatedState.selected).toEqual(selectedItems);
        expect(inputProps.onChange).toHaveBeenCalledWith(
          selectedItems.map(i => i.value),
        );
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
});
