import { mount, shallow } from 'enzyme';
import React from 'react';
import { Spinner } from '@centrifuge/axis-spinner';
import { Modal } from '@centrifuge/axis-modal';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Paragraph, TextArea } from 'grommet';
import { withAxis } from '../../test-utilities/test-providers';
import SchemaForm from '../SchemaForm';
import { Schema } from '@centrifuge/gateway-lib/models/schema';


describe('Schema Form', () => {


  const onSubmit = jest.fn(() => {
  });

  const onDiscard = jest.fn(() => {
  });

  beforeEach(() => {
    onSubmit.mockClear();
    onDiscard.mockClear();
  });

  const info = 'Some custom information';
  const submitLabel = 'Custom submit';

  it('should render the Schema form with default values', async () => {
    const schema = Schema.getDefaultValues();

    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={false}
          onDiscard={onDiscard}
          onSubmit={onSubmit}/>,
      ),
    );

    expect(component.find(Paragraph).text()).toEqual(info);
    expect(component.find({ label: submitLabel }).find('button').length).toEqual(1);
    expect(component.find(TextArea).prop('defaultValue')).toEqual(Schema.toEditableJson(schema));

  });


  it('should not submit the form because of form validation', async () => {
    const schema = Schema.getDefaultValues();
    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={false}
          onDiscard={onDiscard}
          onSubmit={onSubmit}/>,
      ),
    );

    const submit = component.find({ label: submitLabel }).find('button');
    submit.simulate('submit');
    expect(onSubmit).toHaveBeenCalledTimes(0);
  });


  it('should  submit the form', async () => {
    const schema: any = Schema.getDefaultValues();
    schema.name = 'test-schema';

    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={false}
          onDiscard={onDiscard}
          onSubmit={onSubmit}/>,
      ),
    );

    const submit = component.find({ label: submitLabel }).find('button');
    submit.simulate('submit');
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledWith({
      _id: undefined,
      ...schema,
    });
  });


  it('should discard the form', async () => {
    const schema = Schema.getDefaultValues();
    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={false}
          onDiscard={onDiscard}
          onSubmit={onSubmit}/>,
      ),
    );

    const discard = component.find({ label: 'Discard' }).find('button');
    discard.simulate('click');
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('Should have all fields disabled in readonly/view mode', async () => {

    const schema = Schema.getDefaultValues();

    const component = mount(
      withAxis(
        <SchemaForm
          selectedSchema={schema}
          submitLabel={submitLabel}
          infoParagraph={info}
          readonly={true}
          onDiscard={onDiscard}
          onSubmit={onSubmit}/>,
      ),
    );

    expect(component.find({ readOnly: true }).find(TextArea).length).toBe(1);

  });

});


