import React from 'react';
import { shallow, mount } from 'enzyme';
import SearchSelect from './SearchSelect';

describe('Search Select', () => {
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
    let searchSelectShallow;

    beforeEach(() => {
      searchSelectShallow = shallow(
        <SearchSelect
          label="Some field"
          {...inputProps}
          items={items}
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
      expect(state.items).toBe(items);
      expect(state.selected).toEqual({ label: '', value: '' });
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

        const updatedState = searchSelectShallow.state();
        expect(updatedState.selected).toEqual(orangeJuice);
        expect(inputProps.onChange).toHaveBeenCalledWith(orangeJuice.value);
      });
    });

    describe('onSearch', () => {
      describe('when search string partially matches a label', () => {
        it('should return the matching items', function() {
          const instance = searchSelectShallow.instance();
          instance.onSearch('co');

          const state = searchSelectShallow.state();
          expect(state.items.length).toBe(2);
          expect(state.items).toEqual(items.slice(1));
        });
      });

      describe('when search string does not match a label', () => {
        it('should return an empty array', function() {
          const instance = searchSelectShallow.instance();
          instance.onSearch('non matching search string');

          const state = searchSelectShallow.state();
          expect(state.items.length).toBe(0);
        });
      });
    });
  });

});
