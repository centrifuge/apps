import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getAllUsers, invite, resetGetAllUsers } from '../../store/actions/users';
import { RequestState } from '../../store/reducers/http-request-reducer';
import { Box, Button, DataTable, Heading, Text } from 'grommet';
import { RouteComponentProps } from 'react-router';
import { User } from '../../common/models/user';
import { PERMISSIONS } from '../../common/constants';
import { Modal } from '@centrifuge/axis-modal';
import UserForm from './UserForm';
import { formatDate } from '../../common/formaters';
import { Preloader } from '../../components/Preloader';
import { NotificationContext } from '../../notifications/NotificationContext';

type UsersListProps = {
  users: User[] | null;
  getAllUsers: () => void;
  resetGetAllUsers: () => void;
  invite: (user: User) => void;
  invitingUser: RequestState<User>;
};

class UsersList extends React.Component<UsersListProps & RouteComponentProps> {
  displayName = 'UsersList';

  state = {
    userFormOpened: false,
  };

  componentDidMount() {
    this.props.getAllUsers();
  }

  componentWillUnmount() {
    this.props.resetGetAllUsers();
  }

  closeUserForm = () => {
    this.setState({ userFormOpened: false });
  };

  openUserForm = () => {
    this.setState({ userFormOpened: true });
  };

  inviteUser = (user) => {
    this.props.invite(user);
    this.closeUserForm();
  };

  renderPermission = (permission) => {
    if (permission === PERMISSIONS.CAN_MANAGE_USERS) {
      return (<Text>Admin</Text>);
    }
    if (permission === PERMISSIONS.CAN_FUND_INVOICES) {
      return (<Text>Funder</Text>);
    }
    if (permission === PERMISSIONS.CAN_CREATE_INVOICES) {
      return (<Text>Supplier</Text>);
    }
  };


  renderUsers = (data) => {

    return (
      <Box>
        <DataTable
          data={data}
          sortable={true}
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
                data.account ? <Text>{data.account}</Text> : null,
            },
            {
              property: 'date_added',
              header: 'Date added',
              render: data =>
                data.date_added ? <Text>{formatDate(data.date_added)}</Text> : null,
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
                return data.permissions.length > 0 ? this.renderPermission(data.permissions[0]) : null;
              },
            },
          ]}
        />
      </Box>
    );
  };


  render() {

    const { users, invitingUser } = this.props;
    if (!this.props.users) {
      return <Preloader message="Loading"/>;
    }

    if (invitingUser && invitingUser.loading) {
      return <Preloader message="Creating user" withSound={true}/>;
    }

    return (
      <Box fill>
        <Modal
          opened={this.state.userFormOpened}
          headingProps={{ level: 3 }}
          width={'medium'}
          title={'Create user'}
          onClose={this.closeUserForm}
        >
          <UserForm user={new User()} onSubmit={this.inviteUser} onDiscard={this.closeUserForm}/>
        </Modal>
        <Box justify="between" direction="row" align="center">
          <Heading level="3">User Management</Heading>
          <Box>
            <Button primary label="Create User" onClick={this.openUserForm}/>
          </Box>
        </Box>
        {this.renderUsers(users)}
      </Box>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    users: state.user.list.data || null,
    invitingUser: state.user.invite,
  };
};

export default connect(
  mapStateToProps,
  {
    getAllUsers,
    resetGetAllUsers,
    invite,
  },
)(UsersList);
