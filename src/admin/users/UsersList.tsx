import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  getAllUsers,
  resetGetAllUsers,
} from '../../store/actions/users';
import { RequestState } from '../../store/reducers/http-request-reducer';
import { Box, Button, DataTable, Heading, Text } from 'grommet';
import { RouteComponentProps, withRouter } from 'react-router';
import { User } from "../../common/models/user";
import {PERMISSIONS} from "../../common/constants";
import { Modal } from '@centrifuge/axis-modal'
import InviteForm from "./InviteForm";

type UsersListProps = {
  users: any;
  getAllUsers: () => void;
  resetGetAllUsers: () => void;
  loading: boolean;
};

class UsersList extends React.Component<UsersListProps & RouteComponentProps> {
  displayName = 'UsersList';

  state = {
    show: false
  }

  componentDidMount() {
    this.props.getAllUsers()
  }

  componentWillUnmount() {
    this.props.resetGetAllUsers()
  }

  clickOut = () => {
    this.setState({show: false})
  }

  renderPermission = (permission) => {
      if (permission === PERMISSIONS.CAN_MANAGE_USERS) {
        return( <Text>Admin</Text>)
      }
      if (permission === PERMISSIONS.CAN_FUND_INVOICES) {
        return (<Text>Funder</Text>)
      }
      if (permission === PERMISSIONS.CAN_CREATE_INVOICES) {
        return (<Text>Supplier</Text>)
      }
  }


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
                  header: 'Date Added',
                  render: data =>
                      data.date_added ? <Text>{data.date_added}</Text> : null,
                },
                {
                  property: 'permissions',
                  header: 'User Rights',
                  render: data =>
                  {
                    data.permissions.length > 0 ? this.renderPermission(data.permissions[0]) : null
                  }},
              ]}
          />
        </Box>
    )
  }

  renderForm = () => {

    return (
        <InviteForm
            reveal={this.clickOut}
        />
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
                <Button primary label="Invite User" onClick={() => {this.setState({show: true})}} />
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
      getAllUsers, resetGetAllUsers
    },
)(withRouter(UsersList));
