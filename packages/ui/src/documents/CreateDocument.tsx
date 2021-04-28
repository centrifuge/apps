import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { Link } from 'react-router-dom';
import DocumentForm from './DocumentForm';
import { RouteComponentProps, withRouter } from 'react-router';
import { Box, Button, Heading } from 'grommet';
import { LinkPrevious } from 'grommet-icons';
import { SecondaryHeader } from '../components/SecondaryHeader';
import documentRoutes from './routes';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import { Document } from '@centrifuge/gateway-lib/models/document';
import { httpClient } from '../http-client';
import { mapSchemaNames } from '@centrifuge/gateway-lib/utils/schema-utils';
import {
  NOTIFICATION,
  NotificationContext,
} from '../components/NotificationContext';
import { AuthContext } from '../auth/Auth';
import { useMergeState } from '../hooks';
import { PageError } from '../components/PageError';
import { AxiosError } from 'axios';
import { HARDCODED_FIELDS } from '@centrifuge/gateway-lib/utils/constants';
import { goToHomePage } from '../utils/goToHomePage';

type Props = RouteComponentProps;

type State = {
  defaultDocument: Document;
  error: any;
  contacts: Contact[];
  schemas: Schema[];
};

function templateEmpty(template: string | undefined): boolean {
  if (template === undefined) {
    return true;
  }
  if (template === '') {
    return true;
  }
  if (template === '0x0000000000000000000000000000000000000000') {
    return true;
  }
  return false;
}

export const CreateDocument: FunctionComponent<Props> = props => {
  const [
    { defaultDocument, contacts, schemas, error },
    setState,
  ] = useMergeState<State>({
    defaultDocument: {
      attributes: {},
    },
    error: null,
    contacts: [],
    schemas: [],
  });

  const {
    history: { push },
  } = props;

  const notification = useContext(NotificationContext);
  const { user, token } = useContext(AuthContext);

  const displayPageError = useCallback(
    error => {
      setState({
        error,
      });
    },
    [setState],
  );

  const loadData = useCallback(async () => {
    setState({});
    try {
      const contacts = (await httpClient.contacts.list(token!)).data;
      const schemas = (
        await httpClient.schemas.list(
          {
            archived: { $exists: false, $ne: true },
          },
          token!,
        )
      ).data;
      setState({
        contacts,
        schemas,
      });
    } catch (e) {
      displayPageError(e);
    }
  }, [setState, displayPageError, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOnSubmit = async (document: Document) => {
    setState({
      defaultDocument: document,
    });
    let createResult: Document | undefined;
    try {
      document = {
        ...document,
        attributes: {
          ...document.attributes,
          [HARDCODED_FIELDS.ORIGINATOR]: {
            type: 'bytes',
            value: user?.account,
          } as any,
        },
      };

      if (templateEmpty(document.template)) {
        createResult = (await httpClient.documents.create(document, token!))
          .data;
      } else {
        createResult = (await httpClient.documents.clone(document, token!))
          .data;
      }
      push(documentRoutes.index);

      await httpClient.documents.commit(createResult._id!, token!);

      const result = await httpClient.documents.create(
        {
          document_id: createResult.header!.document_id,
          header: createResult.header,
          attributes: {
            ...createResult.attributes,
            [HARDCODED_FIELDS.ASSET_IDENTIFIER]: {
              type: 'bytes',
              value: createResult.header!.document_id,
            } as any,
          },
          template: createResult.template,
        },
        token!,
      );

      await httpClient.documents.commit(result.data._id!, token!);
    } catch (e) {
      console.error(e);

      notification.alert({
        type: NOTIFICATION.ERROR,
        title: 'Failed to save document',
        message: (e as AxiosError)!.response?.data.message,
      });
    }
  };

  const onCancel = () => {
    push(documentRoutes.index);
  };

  if (error) return <PageError error={error} />;

  const availableSchemas = mapSchemaNames(user!.schemas, schemas);

  if (!token) {
    goToHomePage();
  }

  return (
    <DocumentForm
      document={defaultDocument}
      schemas={availableSchemas}
      onSubmit={handleOnSubmit}
      mode={'create'}
      contacts={contacts}
      renderHeader={() => {
        return (
          <SecondaryHeader>
            <Box direction="row" gap="small" align="center">
              <Link to={documentRoutes.index}>
                <LinkPrevious />
              </Link>
              <Heading level="3">{'New Document'}</Heading>
            </Box>

            <Box direction="row" gap="medium">
              <Button onClick={onCancel} label="Discard" />

              <Button type="submit" primary label="Save" />
            </Box>
          </SecondaryHeader>
        );
      }}
    ></DocumentForm>
  );
};

export default withRouter(CreateDocument);
