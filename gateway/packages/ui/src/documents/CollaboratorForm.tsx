import React from 'react';
import { Box, Button, FormField, RadioButton } from 'grommet';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Contact, getContactByAddress } from '@centrifuge/gateway-lib/models/contact';
import { Collaborator } from '@centrifuge/gateway-lib/models/collaborator';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { DOCUMENT_ACCESS } from '@centrifuge/gateway-lib/models/document';
import { ViewModeFormContainer } from '../components/ViewModeFormContainer';

type Props = {
  onSubmit: (data: Collaborator) => void;
  onDiscard: () => void;
  contacts: Contact[];
  submitLabel: string,
  viewMode?: boolean,
  selectedCollaborator?: Collaborator
};


// TODO use function components here
export default class CollaboratorForm extends React.Component<Props> {

  state = { submitted: false };

  onSubmit = (values: any) => {
    return this.props.onSubmit({
      ...this.props.selectedCollaborator,
      ...values,
    });
  };

  onDiscard = () => {
    this.props.onDiscard();
  };

  render() {

    const { submitted } = this.state;
    const {
      contacts,
      selectedCollaborator,
      viewMode,
      submitLabel,
    } = this.props;
    const columnGap = 'medium';
    const sectionGap = 'large';

    const formValidation = Yup.object().shape({
      name: Yup.string()
        .required('This field is required'),
      address: Yup.string()
        .required('This field is required'),
      access: Yup.string()
        .required('This field is required'),
    });

    const initialValues = selectedCollaborator || {
      name: '',
      address: '',
      access: '',
    };


    return (
      <ViewModeFormContainer isViewMode={viewMode} pad={{ top: 'large', bottom: 'large' }}>
        <Formik
          validationSchema={formValidation}
          initialValues={initialValues}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          onSubmit={(values, { setSubmitting }) => {
            this.onSubmit(values);
            setSubmitting(true);
          }}
        >
          {
            ({
               values,
               errors,
               handleChange,
               setFieldValue,
               submitForm,
             }) => {

              const selectedContact = getContactByAddress(values.address, contacts) || {
                name: '',
                address: '',
              };
              return (
                <>
                  <Box direction="column" gap={sectionGap}>

                    <Box gap={columnGap}>
                      <FormField
                        label="Collaborator"
                        error={errors.name || errors.address}
                      >
                        <SearchSelect
                          name={'collaborator'}
                          disabled={viewMode}
                          labelKey={'name'}
                          options={contacts}
                          value={selectedContact}
                          onChange={(selected) => {
                            setFieldValue('name', selected.name);
                            setFieldValue('address', selected.address);
                          }}
                        />
                      </FormField>
                      <FormField
                        label="Access level"
                        error={errors.access}
                      >
                        <Box pad={{ vertical: 'medium' }} gap="small">
                          <RadioButton
                            disabled={viewMode}
                            label="Read"
                            name="access"
                            value={DOCUMENT_ACCESS.READ}
                            checked={values.access === DOCUMENT_ACCESS.READ}
                            onChange={handleChange}
                          />
                          <RadioButton
                            disabled={viewMode}
                            label="Write"
                            name="access"
                            value={DOCUMENT_ACCESS.WRITE}
                            checked={values.access === DOCUMENT_ACCESS.WRITE}
                            onChange={handleChange}
                          />
                        </Box>
                      </FormField>

                    </Box>
                  </Box>

                  <Box direction="row" justify={'end'} gap="medium" margin={{ top: 'medium' }}>
                    <Button
                      onClick={this.onDiscard}
                      label="Discard"
                    />

                    {!viewMode && <Button
                      onClick={() => {
                        this.setState({ submitted: true });
                        submitForm();
                      }}
                      primary
                      label={submitLabel}
                    />}
                  </Box>
                </>
              );
            }
          }
        </Formik>
      </ViewModeFormContainer>
    );

  }
}


