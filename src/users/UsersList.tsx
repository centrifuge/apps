import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react';
import { Anchor, Box, Button, DataTable, Heading, Text } from 'grommet';
import { User } from '../common/models/user';
import { Modal } from '@centrifuge/axis-modal';
import UserForm from './UserForm';
import { formatDate } from '../common/formaters';
import { Preloader } from '../components/Preloader';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { DisplayField } from '@centrifuge/axis-display-field';
import { Schema } from '../common/models/schema';
import { mapSchemaNames } from '../common/schema-utils';
import { PERMISSIONS } from '../common/constants';
import { httpClient } from '../http-client';
import { getAddressLink } from '../common/etherscan';
import { PageError } from '../components/PageError';
import { useMergeState } from '../hooks';
import { NOTIFICATION, NotificationContext } from '../components/notifications/NotificationContext';
import { AxiosError } from 'axios';


type State = {
  loadingMessage: string | null;
  userFormOpened: boolean;
  users: User[];
  schemas: Schema[];
  selectedUser: User;
  error: any;
}

const UsersList: FunctionComponent = () => {

  const [
    {
      loadingMessage,
      userFormOpened,
      users,
      schemas,
      selectedUser,
      error,
    },
    setState] = useMergeState<State>({
    loadingMessage: 'Loading',
    userFormOpened: false,
    selectedUser: new User(),
    users: [],
    schemas: [],
    error: null,
  });

  const notification = useContext(NotificationContext);


  const displayPageError = useCallback((error) => {
    setState({
      loadingMessage: null,
      error,
    });
  }, [setState]);


  const loadData = useCallback(async () => {
    setState({
      loadingMessage: 'Loading',
    });
    try {

      const users = (await httpClient.user.list()).data;
      const schemas = (await httpClient.schemas.list({ archived: { $exists: false, $ne: true } })).data;

      setState({
        loadingMessage: null,
        userFormOpened: false,
        users,
        schemas,
      });

    } catch (e) {
      displayPageError(e);
    }
  }, [setState, displayPageError]);


  useEffect(() => {
    loadData();
  }, [loadData]);


  const closeUserForm = () => {
    setState({ userFormOpened: false });
  };

  const openUserForm = (user: User) => {
    setState({
      selectedUser: user,
      userFormOpened: true,
    });
  };


  const onUserFormSubmit = async (user: User) => {

    let context: any = {};
    if (user._id) {
      context.loadingMessage = 'Updating user';
      context.errorTitle = 'Failed to update user';
      context.method = 'update';
    } else {
      context.loadingMessage = 'Inviting user';
      context.errorTitle = 'Failed to invite user';
      context.method = 'invite';
    }

    try {
      setState({
        userFormOpened:false,
        loadingMessage: context.loadingMessage,
      });
      await httpClient.user[context.method](user);
      await loadData();
    } catch (e) {
      notification.alert({
        type: NOTIFICATION.ERROR,
        title: context.errorTitle,
        message: (e as AxiosError)!.response!.data.message,
      });

      setState({
        loadingMessage: null,
      });
    }
  };


  const renderUsers = (data, schemas) => {

    return (
      <DataTable
        data={data}
        primaryKey={'_id'}
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
              data.account ? <DisplayField
                as={'span'}
                copy={true}
                link={{
                  href: getAddressLink(data.account),
                  target: '_blank',
                }}
                value={data.account}
              /> : null,
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
            sortable: false,
            header: 'User rights',
            render: data => {
              return data.permissions.join(', ');
            },
          },
          {
            property: 'schemas',
            sortable: false,
            header: 'Document schemas',
            render: data => {// User has not schemas display
              if (!Array.isArray(data.schemas)) return '';
              const activeSchemas = mapSchemaNames(data.schemas, schemas)
                .map(s => s.name).join(', ');
              if (data.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS) && activeSchemas.length === 0) {
                return <Text color="status-error">User should have at least one active schema assigned</Text>;
              }

              return activeSchemas;
            },
          },
          {
            property: 'actions',
            sortable: false,
            header: 'Actions',
            render: data => (
              <Box direction="row" gap="small">

                <Anchor
                  label={'Edit'}
                  onClick={() =>
                    openUserForm(data)
                  }
                />
              </Box>
            ),
          },
        ]}
      />
    );
  };


  if (loadingMessage) {
    return <Preloader message={loadingMessage}/>;
  }

  if (error) {
    return <PageError error={error}/>;
  }


  return (
    <Box fill>
      <Modal
        opened={userFormOpened}
        headingProps={{ level: 3 }}
        width={'large'}
        title={selectedUser._id ? 'Edit user' : 'Create user'}
        onClose={closeUserForm}
      >
        <UserForm schemas={schemas} user={selectedUser} onSubmit={onUserFormSubmit}
                  onDiscard={closeUserForm}/>
      </Modal>
      <SecondaryHeader>
        <Heading level="3">User Management</Heading>
        <Box>
          <Button
            primary
            label="Create User"
            onClick={() =>
              openUserForm(new User())
            }/>
        </Box>
      </SecondaryHeader>
      <Box pad={{ horizontal: 'medium' }}>
        {renderUsers(users, schemas)}
      </Box>
    </Box>
  );

};


export default UsersList;
