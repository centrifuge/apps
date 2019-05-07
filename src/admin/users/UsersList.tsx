import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  getAllUsers,
  resetGetAllUsers
} from '../../store/actions/users';
import { RequestState } from '../../store/reducers/http-request-reducer';
import {Box, Button, DataTable, Heading, Text, Layer, FormField, TextInput } from 'grommet';
import { RouteComponentProps, withRouter } from 'react-router';
import { Formik, Form } from 'formik';
import * as Yup from 'yup'
import { User } from "../../common/models/user";

type UsersListProps = {

  getAllUsers: () => void;
  resetGetAllUsers: () => void;
  loading: boolean;
};

class UsersList extends React.Component<UsersListProps & RouteComponentProps> {
  displayName = 'UsersList';
  state = {
    show: false,
  }

  componentDidMount() {
    this.props.getAllUsers()
  }

  componentWillUnmount() {
  }

  // onSubmit = (values: Invoice) => {
  //   return this.props.onSubmit && this.props.onSubmit({ ...values });
  // };


  renderUsers = (data) => {
    return (
        <Box>
          <DataTable
              data={data}
              columns={[
                {
                  property: 'username',
                  header: 'Name',
                  render: data =>
                      data.username ? <Text>{data.username}</Text> : null,
                },
                {
                  property: 'email',
                  header: 'Email',
                  render: data =>
                      data.email ? <Text>{data.email}</Text> : null,
                },
                {
                  property: 'account',
                  header: 'Centrifuge ID',
                  render: data =>
                      data.account ? <Text>{data.account}</Text> : null,
                },
              ]}
          />
        </Box>
    )
  }

  renderForm = () => {

    const newAccountValidation = Yup.object().shape({
      name: Yup.string()
          .max(40, 'Please enter no more than 40 characters')
          .required( 'This field is required'),
      email: Yup.string()
          .email('Please enter a valid email')
          .required('This field is required')
    });

    return (
        <Layer onEsc={() => this.setState({show: false})} onClickOutside={() => this.setState({show: false})}>
          <Formik
              initialValues={{ name: '', email: '' }}
              validationSchema={newAccountValidation}
              onSubmit={(values, { setSubmitting }) => {
                // if (!values) return;
                // this.onSubmit(values);
                // setSubmitting(true);
              }}
          >
            {({ values,errors,handleChange, handleSubmit }) => (
                <Box direction='column'>
                  <Heading margin='medium' level='5'>Invite New User</Heading>
                  <Form>
                    <Box fill pad='medium' gap="medium">

                      <FormField
                          label="Name"
                          error={errors!.name}
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
                      <Box direction="row" gap="large" pad="large">
                        <Button label="Discard" onClick={() => this.setState({show: false})} />
                        <Button type="submit" primary label="Save" onClick={() => {
                          this.setState({show: false})
                        }}
                        />
                      </Box>
                    </Box>
                  </Form>
                </Box>
            )}
          </Formik>
        </Layer>
    )
  }

  render() {
    if (this.props.loading || !this.props.users) {
      return 'There are no whitelisted accounts for this application yet. As an admin, you can create and whitelist new user accounts.';
    }

    return  (
        <Box fill>
          <Box justify="between" direction="row" align="center">
            <Heading level="3">User Management</Heading>
              <Box>
                <Button primary label="Invite User" onClick={
                  () => {
                    this.setState({show: true})
                  }
                } />
              </Box>
            { this.state.show && this.renderForm() }
          </Box>
          { this.renderUsers(this.props.users) }
        </Box>
    );
  }
}

export default connect(
    (state: {
      user: {
        list: RequestState<User[]>;
      };
    }) => {
      return {
        users: state.user.list.data,
      };
    },
    {
      getAllUsers, resetGetAllUsers,
    },
)(withRouter(UsersList));
