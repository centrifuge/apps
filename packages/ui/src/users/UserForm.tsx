import React from 'react';
import {
  Box,
  Button,
  CheckBox,
  FormField,
  Select,
  Text,
  TextInput,
} from 'grommet';
import {
  TwoFaType,
  User,
  UserWithOrg,
} from '@centrifuge/gateway-lib/models/user';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { PERMISSIONS } from '@centrifuge/gateway-lib/utils/constants';
import { MultipleSelect } from '@centrifuge/axis-multiple-select';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import { mapSchemaNames } from '@centrifuge/gateway-lib/utils/schema-utils';
import { Organization } from '@centrifuge/gateway-lib/models/organization';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Link } from 'react-router-dom';
import routes from '../routes';

type InviteProps = {
  user: UserWithOrg;
  schemas: Schema[];
  organizations: Organization[];
  onSubmit?: (user) => void;
  onDiscard?: () => void;
};

export default class UserForm extends React.Component<InviteProps> {
  state = { submitted: false, newOrg: false };

  onSubmit = (user: User) => {
    this.props.onSubmit && this.props.onSubmit(user);
  };

  render() {
    const { user, schemas, organizations } = this.props;
    const { submitted, newOrg } = this.state;

    const twoFAOptions = Object.values(TwoFaType)
    const twoFALabels = {
      [TwoFaType.APP]: 'Authenticator App',
      [TwoFaType.EMAIL]: 'Email'
    }

    const userValidation = Yup.object().shape({
      organizationName:
        newOrg &&
        Yup.string()
          .max(40, 'Please enter no more than 40 characters')
          .required('This field is required')
          .test({
            name: 'test_org_name',
            test: function(this, value) {
              if (!value) return true;
              const org = organizations.find(
                o =>
                  o.name?.trim().toLowerCase() === value.trim().toLowerCase(),
              );
              return !org;
            },
            message: 'Organization name exists',
          }),
      account: !newOrg && Yup.string().required('This field is required'),
      name: Yup.string()
        .max(40, 'Please enter no more than 40 characters')
        .required('This field is required'),
      email: Yup.string()
        .email('Please enter a valid email')
        .required('This field is required')
        .test({
          name: 'lowercase_string',
          test: function(this, value) {
            return value && value === value.toLocaleLowerCase();
          },
          message: 'Only lowercase letters',
        }),
      permissions: Yup.array().required('This field is required'),
      twoFAType: Yup.string()
        .oneOf(twoFAOptions, 'Unsupported value')
        .required('This field is required'),
    });

    const permissionOptions = [
      PERMISSIONS.CAN_MANAGE_USERS,
      PERMISSIONS.CAN_MANAGE_SCHEMAS,
      PERMISSIONS.CAN_MANAGE_DOCUMENTS,
      PERMISSIONS.CAN_VIEW_DOCUMENTS,
    ];

    const schemaOptions = schemas.map(i => i.name);

    return (
      <Box margin={{ vertical: 'medium' }} overflow={'auto'}>
        <Formik
          initialValues={user}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          validationSchema={userValidation}
          onSubmit={(values, { setSubmitting }) => {
            this.onSubmit(values);
            setSubmitting(true);
          }}
        >
          {({
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
                <CheckBox
                  label={'Create new organization'}
                  checked={newOrg}
                  onChange={event => {
                    setFieldValue('account', '');
                    setFieldValue('organizationName', '');
                    this.setState({ newOrg: event.target.checked });
                  }}
                />
                {newOrg ? (
                  <FormField
                    label="Organization name"
                    error={errors.organizationName}
                  >
                    <TextInput
                      name="organizationName"
                      value={values!.organizationName}
                      onChange={handleChange}
                    />
                  </FormField>
                ) : (
                  <FormField label="Organization" error={errors.account}>
                    <SearchSelect
                      name="account"
                      labelKey={org => {
                        return org.name + ' / ' + org.account;
                      }}
                      searchPlaceholder="Search organizations"
                      emptySearchMessage="No organizations found"
                      valueKey={'account'}
                      options={organizations}
                      valueLabel={(() => {
                        return values.account ? (
                          <p>
                            {values.organizationName + ' / ' + values.account}
                          </p>
                        ) : (
                          undefined
                        );
                      })()}
                      onChange={selected => {
                        setFieldValue('account', selected.account);
                        setFieldValue('organizationName', selected.name);
                      }}
                    />
                  </FormField>
                )}

                <FormField label="Name" error={errors.name}>
                  <TextInput
                    name="name"
                    value={values!.name}
                    onChange={handleChange}
                  />
                </FormField>
                <FormField label="Email" error={errors!.email}>
                  <TextInput
                    name="email"
                    value={values!.email}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="2Fa Type" error={errors.twoFAType}>
                  <Select
                    name="twoFAType"
                    options={twoFAOptions}
                    value={values!.twoFAType}
                    labelKey={(item) => {
                      return twoFALabels[item]
                    }}
                    onChange={event => {
                      console.info(event.option)
                      setFieldValue('twoFAType', event.option);
                    }}
                  />
                </FormField>

                <Box margin={{ bottom: 'medium' }}>
                  <FormField label="Permissions" error={errors!.permissions}>
                    <MultipleSelect
                      closeOnChange={false}
                      value={values.permissions}
                      options={permissionOptions}
                      onChange={selection => {
                        setFieldValue('permissions', selection);
                        if (
                          !selection.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS)
                        ) {
                          setFieldValue('schemas', []);
                        }
                      }}
                    />
                  </FormField>
                </Box>

                {values.permissions.includes(
                  PERMISSIONS.CAN_MANAGE_DOCUMENTS,
                ) && (
                  <>
                    {schemaOptions && schemaOptions.length > 0 ? (
                      <Box margin={{ bottom: 'medium' }}>
                        <FormField
                          label="Document schemas"
                          error={errors!.schemas}
                        >
                          <MultipleSelect
                            closeOnChange={false}
                            labelKey={item => {
                              return item.label || item.name;
                            }}
                            valueKey={'name'}
                            value={mapSchemaNames(values.schemas, schemas)}
                            options={schemas}
                            onChange={selection => {
                              setFieldValue(
                                'schemas',
                                selection.map(s => s.name),
                              );
                            }}
                          />
                        </FormField>
                      </Box>
                    ) : (
                      <Text color={'status-warning'}>
                        No schemas in the database. Please{' '}
                        <Link to={routes.schemas.index}>add schemas</Link>!
                      </Text>
                    )}
                  </>
                )}

                <Box direction="row" justify={'end'} gap={'medium'}>
                  <Button label="Discard" onClick={this.props.onDiscard} />
                  <Button
                    disabled={!dirty}
                    type="submit"
                    primary
                    label={user._id ? 'Update' : 'Create'}
                  />
                </Box>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    );
  }
}
