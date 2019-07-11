import React from 'react';
import { connect } from 'react-redux';
import { getAllUsers, invite, resetGetAllUsers, updateUser } from '../../store/actions/users';
import { RequestState } from '../../store/reducers/http-request-reducer';
import { Anchor, Box, Button, DataTable, Heading, Text } from 'grommet';
import { RouteComponentProps } from 'react-router';
import { User } from '../../common/models/user';
import { Modal } from '@centrifuge/axis-modal';
import UserForm from './UserForm';
import { formatDate } from '../../common/formaters';
import { Preloader } from '../../components/Preloader';
import { SecondaryHeader } from '../../components/SecondaryHeader';
import { DisplayField } from '../../components/DisplayField';
import { getSchemasList, resetGetSchemasList } from '../../store/actions/schemas';
import { Schema } from '../../common/models/schema';

type UsersListProps = {
  users: User[] | null;
  getAllUsers: typeof getAllUsers;
  resetGetAllUsers: typeof resetGetAllUsers;
  getSchemasList: typeof getSchemasList;
  resetGetSchemasList: typeof resetGetSchemasList;
  invite: typeof invite;
  updateUser: typeof updateUser;
  invitingUser: RequestState<User>;
  updatingUser: RequestState<User>;
  schemas: RequestState<Schema[]>;
};

class UsersList extends React.Component<UsersListProps & RouteComponentProps> {
  displayName = 'UsersList';

  state = {
    userFormOpened: false,
    selectedUser: new User(),
  };

  componentDidMount() {
    this.props.getAllUsers();
    this.props.getSchemasList();
  }

  componentWillUnmount() {
    this.props.resetGetAllUsers();
    this.props.resetGetSchemasList();
  }

  closeUserForm = () => {
    this.setState({ userFormOpened: false });
  };

  openUserForm = (user: User) => {

    this.setState({
      selectedUser: user,
      userFormOpened: true,
    });
  };


  onUserFormSubmit = (user) => {
    if (user._id) {
      this.props.updateUser(user);
    } else {
      this.props.invite(user);
    }
    this.closeUserForm();
  };


  renderUsers = (data) => {

    return (
      <DataTable
        data={data}
        primaryKey={'_id'}
        columns={[
          {
            property: 'name',
            header: 'Name',
            render: data =>
              data.name ? <Text>{data.name}</Text> : null,
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
              data.account ? <DisplayField width={'160px'} noBorder value={data.account}/> : null,
          },
          {
            property: 'createdAt',
            header: 'Date added',
            render: data =>
              data.createdAt ? <Text>{formatDate(data.createdAt)}</Text> : null,
          },
          {
            property: 'enabled',
            header: 'Status',
            render: data =>
              data.enabled ? <Text color="status-ok">Active</Text> : <Text color="status-warning">Created</Text>,
          },
          {
            property: 'permissions',
            header: 'User rights',
            render: data => {
              return data.permissions.join(', ');
            },
          },
          {
            property: 'schemas',
            header: 'Document schemas',
            render: data => {
              return data.schemas && Array.isArray(data.schemas) ? data.schemas.join(', ') : '';
            },
          },
          {
            property: 'actions',
            header: 'Actions',
            render: data => (
              <Box direction="row" gap="small">

                <Anchor
                  label={'Edit'}
                  onClick={() =>
                    this.openUserForm(data)
                  }
                />
              </Box>
            ),
          },
        ]}
      />
    );
  };


  render() {

    const { users, invitingUser, updatingUser, schemas } = this.props;
    if (!this.props.users || !this.props.schemas) {
      return <Preloader message="Loading"/>;
    }

    if (invitingUser && invitingUser.loading) {
      return <Preloader message="Creating user" withSound={true}/>;
    }

    if (updatingUser && updatingUser.loading) {
      return <Preloader message="Updating user" withSound={true}/>;
    }

    const user = this.state.selectedUser;

    return (
      <Box fill>
        <Modal
          opened={this.state.userFormOpened}
          headingProps={{ level: 3 }}
          width={'medium'}
          title={user._id ? 'Edit user' : 'Create user'}
          onClose={this.closeUserForm}
        >
          <UserForm schemas={schemas.data || []} user={user} onSubmit={this.onUserFormSubmit}
                    onDiscard={this.closeUserForm}/>
        </Modal>
        <SecondaryHeader>
          <Heading level="3">User Management</Heading>
          <Box>
            <Button
              primary
              label="Create User"
              onClick={ () =>
                this.openUserForm(new User())
              }/>
          </Box>
        </SecondaryHeader>
        <Box pad={{ horizontal: 'medium' }}>
          {this.renderUsers(users)}
        </Box>
      </Box>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    users: state.user.list.data || [],
    invitingUser: state.user.invite,
    updatingUser: state.user.update,
    schemas: state.schemas.getList,
  };
};

export default connect(
  mapStateToProps,
  {
    getAllUsers,
    resetGetAllUsers,
    invite,
    updateUser,
    getSchemasList,
    resetGetSchemasList,
  },
)(UsersList);
