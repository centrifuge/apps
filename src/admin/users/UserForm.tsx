import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, FormField, RadioButtonGroup, TextInput } from 'grommet';
import { User } from '../../common/models/user';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { PERMISSIONS } from '../../common/constants';

type InviteProps = {
  user: User,
  onSubmit: (user) => void;
  onDiscard: () => void;
}

export default class UserForm extends React.Component<InviteProps> {

  state = { submitted: false };

  onSubmit = async (user: User) => {
    this.props.onSubmit(user);
  };


  render() {

    const newUserValidation = Yup.object().shape({
      name: Yup.string()
        .max(40, 'Please enter no more than 40 characters')
        .required('This field is required'),
      email: Yup.string()
        .email('Please enter a valid email')
        .required('This field is required'),
      permissions: Yup.array()
        .required('This field is required'),
    });

    const { user } = this.props;
    const { submitted } = this.state;

    return (
      <Box width={'medium'} margin={{ vertical: 'medium' }}>
        <Formik
          initialValues={user}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          validationSchema={newUserValidation}
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
             }) => (
              <form
                onSubmit={event => {
                  this.setState({ submitted: true });
                  handleSubmit(event);
                }}
              >
                <Box gap="small">
                  <FormField
                    label="Name"
                    error={errors.name}
                  >
                    <TextInput
                      name="name"
                      value={values.name || ''}
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

                  <Box margin={{ vertical: 'medium' }}>
                    <FormField
                      label="Permissions"
                      error={errors!.permissions}
                    >
                      <RadioButtonGroup
                        pad={{ vertical: 'medium' }}
                        direction="row"
                        name="radio"
                        options={[
                          { label: 'Funder', value: PERMISSIONS.CAN_FUND_INVOICES },
                          { label: 'Supplier', value: PERMISSIONS.CAN_CREATE_INVOICES },
                          { label: 'Admin', value: PERMISSIONS.CAN_MANAGE_USERS },
                        ]}
                        value={values.permissions[0]}
                        onChange={(ev) => {
                          setFieldValue('permissions', [ev.target.value]);
                        }}
                      />
                    </FormField>


                  </Box>

                  <Box direction="row" justify={'end'} gap={'medium'}>
                    <Button
                      label="Discard"
                      onClick={this.props.onDiscard}
                    />
                    <Button
                      type="submit"
                      primary
                      label="Create"
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

