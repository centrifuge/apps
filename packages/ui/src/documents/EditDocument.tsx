import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { Link } from 'react-router-dom';

import DocumentForm from './DocumentForm';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { Box, Button, Heading } from 'grommet';
import { LinkPrevious } from 'grommet-icons';
import { canWriteToDoc } from '@centrifuge/gateway-lib/models/user';
import { Preloader } from '../components/Preloader';
import {
  Document,
  documentIsEditable,
} from '@centrifuge/gateway-lib/models/document';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import { httpClient } from '../http-client';
import { AppContext } from '../App';
import { useMergeState } from '../hooks';
import { PageError } from '../components/PageError';
import documentRoutes from './routes';
import {
  NOTIFICATION,
  NotificationContext,
} from '../components/NotificationContext';
import { AxiosError } from 'axios';
import { FundingAgreements } from './FundingAgreements';
import { Nfts } from './Nfts';
import { extendContactsWithUsers } from '@centrifuge/gateway-lib/models/contact';

type Props = RouteComponentProps<{ id: string }>;

type State = {
  loadingMessage: string | null;
  document?: Document;
  schemas: Schema[];
  contacts: Contact[];
  error?: any;
};

export const EditDocument: FunctionComponent<Props> = (props: Props) => {
  const {
    history: { push },
    match: {
      params: { id },
    },
  } = props;
  const [
    { loadingMessage, contacts, document, schemas, error },
    setState,
  ] = useMergeState<State>({
    loadingMessage: 'Loading',
    schemas: [],
    contacts: [],
  });

  const { user } = useContext(AppContext);
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
      const contacts = (await httpClient.contacts.list()).data;
      const schemas = (await httpClient.schemas.list()).data;
      const document = (await httpClient.documents.getById(id)).data;
      setState({
        loadingMessage: null,
        contacts,
        schemas,
        document,
      });
    } catch (e) {
      displayPageError(e);
    }
  }, [id, setState, displayPageError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateDocument = async (newDoc: Document) => {
    setState({
      loadingMessage: 'Updating document',
    });
    try {
      const document = (await httpClient.documents.update(newDoc)).data;
      setState({
        loadingMessage: null,
        document,
      });
    } catch (e) {
      displayModalError(e, 'Failed to update document');
    }
  };

  const startLoading = (loadingMessage: string = 'Loading') => {
    setState({ loadingMessage });
  };

  const returnToList = () => {
    push(documentRoutes.index);
  };

  const displayModalError = (e: AxiosError, title: string = 'Error') => {
    setState({
      loadingMessage: null,
    });
    notification.alert({
      type: NOTIFICATION.ERROR,
      title,
      message: e!.response!.data.message,
    });
  };

  const onCancel = () => {
    props.history.goBack();
  };

  if (loadingMessage) return <Preloader message={loadingMessage} />;
  if (error) return <PageError error={error} />;
  // Redirect to view when the user can not edit this document
  if (!canWriteToDoc(user!, document) || !documentIsEditable(document!))
    return <Redirect to={documentRoutes.view.replace(':id', id)} />;

  const selectedSchema: Schema | undefined = schemas.find(s => {
    return !!(
      document &&
      document.attributes &&
      document.attributes._schema &&
      s.name === document.attributes._schema.value
    );
  });

  if (!selectedSchema)
    return (
      <PageError
        error={new Error('Can not find schema definition for document')}
      />
    );

  // Add mint action if schema has any registries defined
  const canMint =
    selectedSchema!.registries && selectedSchema!.registries.length > 0;
  const canFund = canWriteToDoc(user, document);
  const extendedContacts = extendContactsWithUsers(contacts, [user!]);

  return (
    <>
      <DocumentForm
        onSubmit={updateDocument}
        selectedSchema={selectedSchema}
        mode={'edit'}
        contacts={extendedContacts}
        document={document}
        schemas={schemas}
        renderHeader={() => {
          return (
            <SecondaryHeader>
              <Box direction="row" gap="small" align="center">
                <Link to={documentRoutes.index}>
                  <LinkPrevious />
                </Link>
                <Heading level="3">{'Update Document'}</Heading>
              </Box>

              <Box direction="row" gap="medium">
                <Button onClick={onCancel} label="Discard" />
                <Button type="submit" primary label="Update" />
              </Box>
            </SecondaryHeader>
          );
        }}
      >
        <Nfts
          onAsyncStart={startLoading}
          onAsyncComplete={loadData}
          onAsyncError={displayModalError}
          onMintStart={returnToList}
          viewMode={!canMint}
          document={document!}
          contacts={contacts}
          registries={selectedSchema!.registries}
        />

        {selectedSchema!.formFeatures &&
          selectedSchema!.formFeatures!.fundingAgreement && (
            <FundingAgreements
              onAsyncStart={startLoading}
              onAsyncComplete={loadData}
              onAsyncError={displayModalError}
              viewMode={!canFund}
              document={document!}
              user={user}
              contacts={contacts}
            />
          )}
      </DocumentForm>
    </>
  );
};

export default withRouter(EditDocument);
