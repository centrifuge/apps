import React from 'react';
import { mount, shallow } from 'enzyme';
import MutipleSelect from './MutipleSelect';
import { serializeSnapshot } from '../../testing/serialize';

describe('Mutiple Select', () => {


  const options = [
    'option-1',
    'option-2',
    'option-3',
    'option-4',
    'option-5',
  ];

  const arrayOfObjects = [
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

  const inputProps = {
    name: 'dropdown',
    onChange: jest.fn(),
    value: undefined,
    options
  };


  const initialise = (props:any = inputProps) => {
    const multipleSelect = mount(
      <MutipleSelect
        {...props}
      />,
    );

    ['onChange'].forEach(cb =>
      inputProps[cb].mockClear(),
    );

    return multipleSelect;

  };

  describe('when single item select', () => {


    it('should match snapshot for array of strings', () => {
      const multipleSelect = initialise();
      expect(serializeSnapshot(multipleSelect)).toMatchSnapshot();
    });

    it('should match snapshot for array of objects', () => {
      const multipleSelect = initialise({
        ...inputProps,
        options: arrayOfObjects,
        labelKey: 'label',
        valueKey: 'value',
      });
      expect(serializeSnapshot(multipleSelect)).toMatchSnapshot();
    });

    it('should initialize the state', function() {
      const multipleSelect = initialise();
      const state = multipleSelect.state();
      expect(state.options).toBe(options);
      expect(state.selected).toEqual([]);
    });

    describe('onChange', () => {
      it('should update the state and invoke the onchange input prop', function() {
        const multipleSelect = initialise();
        const instance = multipleSelect.instance();
        const orangeJuice = 'orange-juice';

        instance.onChange([orangeJuice]);

        const updatedState = multipleSelect.state();
        expect(updatedState.selected).toEqual([orangeJuice]);
        expect(inputProps.onChange).toHaveBeenCalledWith([orangeJuice]);
      });
    });

     describe('onSearch', () => {
       describe('when search string partially matches a label', () => {

         it('should return the matching items or list of strings', function() {
           const multipleSelect = initialise({
             ...inputProps,
             search: true
           });
           const instance = multipleSelect.instance();
           instance.onSearch('option-1');

           const state = multipleSelect.state();
           expect(state.options.length).toBe(1);
           expect(state.options).toEqual(options.slice(0,1));
         });
       });

         it('should return the matching items or list of ojects', function() {
           const multipleSelect = initialise({
             ...inputProps,
             options: arrayOfObjects,
             labelKey: 'label',
             valueKey: 'value',
             search: true
           });
           const instance = multipleSelect.instance();
           instance.onSearch('co');

           const state = multipleSelect.state();
           expect(state.options.length).toBe(2);
           expect(state.options).toEqual(arrayOfObjects.slice(1));
         });
       });


  });

});
