import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { Anchor, Box, Button, Heading, Text } from 'grommet';
import { User, UserWithOrg } from '@centrifuge/gateway-lib/models/user';
import { Modal } from '@centrifuge/axis-modal';
import UserForm from './UserForm';
import { formatDate } from '@centrifuge/gateway-lib/utils/formaters';
import { Preloader } from '../components/Preloader';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { DisplayField } from '@centrifuge/axis-display-field';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import { mapSchemaNames } from '@centrifuge/gateway-lib/utils/schema-utils';
import { PERMISSIONS } from '@centrifuge/gateway-lib/utils/constants';
import { httpClient } from '../http-client';
import { getAddressLink } from '@centrifuge/gateway-lib/utils/etherscan';
import { PageError } from '../components/PageError';
import { useMergeState } from '../hooks';
import {
  NOTIFICATION,
  NotificationContext,
} from '../components/NotificationContext';
import { AxiosError } from 'axios';
import { DataTableWithDynamicHeight } from '../components/DataTableWithDynamicHeight';
import { Organization } from '@centrifuge/gateway-lib/models/organization';

type State = {
  loadingMessage: string | null;
  userFormOpened: boolean;
  users: UserWithOrg[];
  schemas: Schema[];
  organizations: Organization[];
  selectedUser: UserWithOrg;
  error: any;
};

const UsersList: FunctionComponent = () => {
  const [
    {
      loadingMessage,
      userFormOpened,
      users,
      schemas,
      selectedUser,
      error,
      organizations,
    },
    setState,
  ] = useMergeState<State>({
    loadingMessage: 'Loading',
    userFormOpened: false,
    selectedUser: new UserWithOrg(),
    users: [],
    schemas: [],
    organizations: [],
    error: null,
  });

  const notification = useContext(NotificationContext);

  const displayPageError = useCallback(
    error => {
      setState({
        loadingMessage: null,
        error,
      });
    },
    [setState],
  );

  const loadData = useCallback(async () => {
    setState({
      loadingMessage: 'Loading',
    });
    try {
      const organizations = (await httpClient.organizations.list()).data;
      const users = (await httpClient.user.list()).data.map(user => {
        const org = organizations.find(o => o.account === user.account);
        const organizationName = org ? org.name : 'undefined';
        return {
          ...user,
          organizationName,
        };
      });

      const schemas = (
        await httpClient.schemas.list({
          archived: { $exists: false, $ne: true },
        })
      ).data;

      setState({
        loadingMessage: null,
        userFormOpened: false,
        users,
        organizations,
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

  const generateDefaultUser = (): UserWithOrg => {
    return {
      ...(new UserWithOrg()),
      permissions: [
        PERMISSIONS.CAN_MANAGE_DOCUMENTS,
        PERMISSIONS.CAN_VIEW_DOCUMENTS,
      ]
    }
  }

  const onUserFormSubmit = async (user: UserWithOrg) => {
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
        userFormOpened: false,
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
      <DataTableWithDynamicHeight
        data={data}
        primaryKey={'_id'}
        sortable={true}
        columns={[
          {
            property: 'name',
            header: 'Name',
            render: data => (data.name ? <Text>{data.name}</Text> : null),
          },
          {
            property: 'email',
            header: 'Email',
            render: data => (data.email ? <Text>{data.email}</Text> : null),
          },
          {
            property: 'organizationName',
            header: 'Organization name',
            render: data =>
              data.organizationName ? (
                <Text>{data.organizationName}</Text>
              ) : null,
          },
          {
            property: 'account',
            header: 'Centrifuge ID',
            render: data =>
              data.account ? (
                <DisplayField
                  as={'span'}
                  copy={true}
                  link={{
                    href: getAddressLink(data.account),
                    target: '_blank',
                  }}
                  value={data.account}
                />
              ) : null,
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
              data.enabled ? (
                <Text color="status-ok">Active</Text>
              ) : (
                <Text color="status-warning">Created</Text>
              ),
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
            render: data => {
              // User has not schemas display
              if (!Array.isArray(data.schemas)) return '';
              const activeSchemas = mapSchemaNames(data.schemas, schemas)
                .map(s => s.label || s.name)
                .join(', ');
              if (
                data.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS) &&
                activeSchemas.length === 0
              ) {
                return (
                  <Text color="status-error">
                    User should have at least one active schema assigned
                  </Text>
                );
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
                <Anchor label={'Edit'} onClick={() => openUserForm(data)} />
              </Box>
            ),
          },
        ]}
      />
    );
  };

  if (loadingMessage) {
    return <Preloader message={loadingMessage} />;
  }

  if (error) {
    return <PageError error={error} />;
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
        <UserForm
          schemas={schemas}
          user={selectedUser}
          organizations={organizations}
          onSubmit={onUserFormSubmit}
          onDiscard={closeUserForm}
        />
      </Modal>
      <SecondaryHeader>
        <Heading level="3">User Management</Heading>
        <Box>
          <Button
            primary
            label="Create User"
            onClick={() => openUserForm(generateDefaultUser())}
          />
        </Box>
      </SecondaryHeader>
      <Box pad={{ horizontal: 'medium' }}>{renderUsers(users, schemas)}</Box>
    </Box>
  );
};

export default UsersList;
