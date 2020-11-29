import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, FormField, Text, TextInput } from 'grommet';
import { User } from '@centrifuge/gateway-lib/models/user';
import routes from './routes';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { isPasswordValid } from '@centrifuge/gateway-lib/utils/validators';

interface RegisterProps {
  email: string;
  error?: Error;
  onSubmit: (values: any) => void;
}

class RegisterForm extends React.Component<RegisterProps> {
  state = { submitted: false };

  onSubmit = values => {
    this.props.onSubmit(values as User);
  };

  render() {
    const { submitted } = this.state;
    const { email, error } = this.props;
    const user = {
      email: email || '',
      password: '',
      passwordConfirm: '',
    };

    const registrationValidation = Yup.object({
      email: Yup.string()
        .email('Please enter a valid email')
        .required('This field is required'),
      password: Yup.string()
        .required('Password is required')
        .test({
          name: 'password_format',
          test: function(this, value) {
            return isPasswordValid(value);
          },
          message: 'Password format not valid',
        }),
      passwordConfirm: Yup.string()
        .oneOf([Yup.ref('password')], 'Password does not match')
        .required('Password confirm is required'),
    });

    return (
          <Formik
            initialValues={user}
            validationSchema={registrationValidation}
            validateOnBlur={submitted}
            validateOnChange={submitted}
            onSubmit={values => {
              this.onSubmit(values);
            }}
          >
            {({ values, errors, handleChange, handleSubmit }) => (
              <form
                onSubmit={event => {
                  this.setState({ submitted: true });
                  handleSubmit(event);
                }}
              >
                <Box gap="small">
                  <FormField label="Email" error={errors.email}>
                    <TextInput
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField
                    label="Password"
                    error={errors.password}
                    info={
                      'Must have at least eight characters, one uppercase letter, one lowercase letter, one number and one special character'
                    }
                  >
                    <TextInput
                      type="password"
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                    />
                  </FormField>
                  <FormField
                    label="Confirm Password"
                    error={errors.passwordConfirm}
                  >
                    <TextInput
                      type="password"
                      name="passwordConfirm"
                      value={values.passwordConfirm}
                      onChange={handleChange}
                    />
                  </FormField>

                  <Text>
                    Already registered? <Link to={routes.index}>Log in</Link>
                  </Text>

                  {error && (
                    <Text color={'status-error'}>Failed to Register!</Text>
                  )}

                  <Box direction="row" height="50px">
                    <Button
                      type="submit"
                      primary
                      label="Register"
                      fill={true}
                    />
                  </Box>
                </Box>
              </form>
            )}
          </Formik>
    );
  }
}

export default RegisterForm;
