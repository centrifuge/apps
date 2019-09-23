import React from 'react';
import { Box, Button, FormField, Text, TextInput } from 'grommet';
import { User } from '../common/models/user';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { PERMISSIONS } from '../common/constants';
import { MultipleSelect } from '@centrifuge/axis-multiple-select';
import { Schema } from '../common/models/schema';
import { mapSchemaNames } from '../common/schema-utils';

type InviteProps = {
  user: User,
  schemas: Schema[],
  onSubmit?: (user) => void;
  onDiscard?: () => void;
}

export default class UserForm extends React.Component<InviteProps> {

  state = { submitted: false };

  onSubmit = (user: User) => {
    this.props.onSubmit && this.props.onSubmit(user);
  };


  render() {

    const userValidation = Yup.object().shape({
      name: Yup.string()
        .max(40, 'Please enter no more than 40 characters')
        .required('This field is required'),
      email: Yup.string()
        .email('Please enter a valid email')
        .required('This field is required'),
      permissions: Yup.array()
        .required('This field is required'),
      schemas: Yup.array()
        .test({
          name: 'test_schemas',
          test: (function(this, value) {
            if (this.parent.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS)) {
              return (value && value.length);
            }
            return true;
          }),
          message: 'This field is required',
        }),
    });

    const { user, schemas } = this.props;

    const { submitted } = this.state;

    const permissionOptions = [
      PERMISSIONS.CAN_MANAGE_USERS,
      PERMISSIONS.CAN_MANAGE_SCHEMAS,
      PERMISSIONS.CAN_MANAGE_DOCUMENTS,
      PERMISSIONS.CAN_VIEW_DOCUMENTS,
    ];


    const schemaOptions = schemas.map(i => i.name);

    return (
      <Box margin={{ vertical: 'medium' }}>
        <Formik
          initialValues={user}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          validationSchema={userValidation}
          onSubmit={(values, { setSubmitting }) => {
            if (!values) return;
            this.onSubmit(values);
            setSubmitting(true);
          }}
        >
          {
            ({
               values,
               errors,
               handleChange,
               handleSubmit,
               setFieldValue,
               dirty,
             }) => (
              <form
                onSubmit={event => {
                  this.setState({ submitted: true });
                  handleSubmit(event);
                }}
              >
                <Box gap="medium">
                  <FormField
                    label="Name"
                    error={errors.name}
                  >
                    <TextInput
                      name="name"
                      value={values!.name}
                      onChange={handleChange}
                    />
                  </FormField>
                  <FormField
                    label="Email"
                    error={errors!.email}
                  >
                    <TextInput
                      name="email"
                      value={values!.email}
                      onChange={handleChange}
                    />
                  </FormField>

                  <Box margin={{ bottom: 'medium' }}>
                    <FormField
                      label="Permissions"
                      error={errors!.permissions}
                    >
                      <MultipleSelect
                        value={values.permissions}
                        options={permissionOptions}
                        onChange={(selection) => {
                          setFieldValue('permissions', selection);
                          if (!selection.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS)) {
                            setFieldValue('schemas', []);
                          }
                        }}
                      />

                    </FormField>
                  </Box>

                  {
                    values.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS) && <>
                      {schemaOptions && schemaOptions.length > 0 ?
                        <Box margin={{ bottom: 'medium' }}>
                          <FormField
                            label="Document schemas"
                            error={errors!.schemas}
                          >
                            <MultipleSelect
                              labelKey={'name'}
                              valueKey={'name'}
                              value={mapSchemaNames(values.schemas, schemas)}
                              options={schemas}
                              onChange={(selection) => {
                                setFieldValue('schemas', selection.map(s => s.name));
                              }}
                            />

                          </FormField>
                        </Box>
                        :
                        <Text color={'status-warning'}>No schemas in the database. Please add schemas!</Text>
                      }
                    </>
                  }

                  <Box direction="row" justify={'end'} gap={'medium'}>
                    <Button
                      label="Discard"
                      onClick={this.props.onDiscard}
                    />
                    <Button
                      disabled={!dirty}
                      type="submit"
                      primary
                      label={user._id ? 'Update' : 'Create'}
                    />
                  </Box>
                </Box>
              </form>
            )
          }
        </Formik>
      </Box>
    );
  }
}

