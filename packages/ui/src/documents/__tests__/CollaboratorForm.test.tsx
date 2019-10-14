import { mount, shallow } from 'enzyme';
import React from 'react';
import { Spinner } from '@centrifuge/axis-spinner';
import { Modal } from '@centrifuge/axis-modal';
import { defaultContacts } from '../../test-utilities/default-data';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { withAxis } from '../../test-utilities/test-providers';
import { RadioButton } from 'grommet';
import CollaboratorForm from '../CollaboratorForm';
import { DOCUMENT_ACCESS } from '@centrifuge/gateway-lib/models/document';
import { Collaborator } from '@centrifuge/gateway-lib/models/collaborator';


describe('Collaborator Form', () => {

  const onSubmit = jest.fn((data) => {
  });

  const onDiscard = jest.fn(() => {
  });

  const submitLabel = 'Anything you feel like';


  it('Should render and empty form', async () => {
    const component = mount(
      withAxis(
        <CollaboratorForm
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}/>,
      ),
    );

    const collaboratorField = component.find({ name: 'collaborator' }).find(SearchSelect);
    const accessOptions = component.find({ name: 'access' }).find(RadioButton);
    const options = collaboratorField.prop('options');
    expect(options).toBe(defaultContacts);
    expect(accessOptions.length).toBe(2);
    expect(accessOptions.at(0).prop('value')).toBe(DOCUMENT_ACCESS.READ);
    expect(accessOptions.at(0).prop('label')).toBe('Read');
    expect(accessOptions.at(1).prop('value')).toBe(DOCUMENT_ACCESS.WRITE);
    expect(accessOptions.at(1).prop('label')).toBe('Write');
  });

  it('Should not submit the form because of validation', async () => {

    const component = mount(
      withAxis(
        <CollaboratorForm
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}/>,
      ),
    );
    const submit = component.find({ label: submitLabel }).find('button');
    submit.simulate('click');
    // Form validator are async so we need wait a little
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledTimes(0);

  });

  it('Should edit and submit the form ', async () => {

    const selectedCollaborator = {
      ...defaultContacts[0],
      access: DOCUMENT_ACCESS.WRITE,
    } as Collaborator;

    const component = mount(
      withAxis(
        <CollaboratorForm
          selectedCollaborator={selectedCollaborator}
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}/>,
      ),
    );

    const collaboratorField = component.find({ name: 'collaborator' }).find(SearchSelect);
    collaboratorField.prop('onChange')(defaultContacts[1]);

    const submit = component.find({ label: submitLabel }).find('button');
    submit.simulate('click');
    // Form validator are async so we need wait a little
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      ...defaultContacts[1],
      access: DOCUMENT_ACCESS.WRITE,
    });

  });


  it('Should discard the form', async () => {

    const component = mount(
      withAxis(
        <CollaboratorForm
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}/>,
      ),
    );
    const discard = component.find({ label: 'Discard' }).find('button');
    discard.simulate('click');
    expect(onDiscard).toHaveBeenCalledTimes(1);

  });

});


