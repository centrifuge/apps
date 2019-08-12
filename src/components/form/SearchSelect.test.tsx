import React from 'react';
import { mount, shallow } from 'enzyme';
import SearchSelect from './SearchSelect';

describe('Search Select', () => {
  const inputProps = {
    labelKey: 'label',
    valueKey: 'value',
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
    let searchSelectShallow;

    beforeEach(() => {
      searchSelectShallow = shallow(
        <SearchSelect
          {...inputProps}
          options={items}
        />,
      );

      ['onBlur', 'onChange', 'onFocus'].forEach(cb =>
        inputProps[cb].mockClear(),
      );
    });

    it('should match snapshot', () => {
      expect(searchSelectShallow).toMatchSnapshot();
    });

    it('should initialize the state', function() {
      const state = searchSelectShallow.state();
      expect(state.options).toBe(items);
      expect(state.selected).toEqual(undefined);
    });

    describe('onChange', () => {
      it('should update the state and invoke the onchange input prop', function() {
        const instance = searchSelectShallow.instance();
        const orangeJuice = {
          value: 'OJ',
          label: 'orange juice',
        };

        instance.onChange({
          value: orangeJuice,
        });

        expect(inputProps.onChange).toHaveBeenCalledWith(orangeJuice);
      });
    });

    describe('onSearch', () => {
      describe('when search string partially matches a label', () => {
        it('should return the matching items', function() {
          const instance = searchSelectShallow.instance();
          instance.onSearch('co');

          const state = searchSelectShallow.state();
          expect(state.options.length).toBe(2);
          expect(state.options).toEqual(items.slice(1));
        });
      });

      describe('when search string does not match a label', () => {
        it('should return an empty array', function() {
          const instance = searchSelectShallow.instance();
          instance.onSearch('non matching search string');

          const state = searchSelectShallow.state();
          expect(state.options.length).toBe(0);
        });
      });
    });
  });

});
