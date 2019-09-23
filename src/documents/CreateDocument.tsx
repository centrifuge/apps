import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DocumentForm from './DocumentForm';
import { RouteComponentProps, withRouter } from 'react-router';
import { Box, Button, Heading } from 'grommet';
import { LinkPrevious } from 'grommet-icons';
import { Preloader } from '../components/Preloader';
import { SecondaryHeader } from '../components/SecondaryHeader';
import documentRoutes from './routes';
import { Schema } from '../common/models/schema';
import { Contact } from '../common/models/contact';
import { Document } from '../common/models/document';
import { httpClient } from '../http-client';
import { mapSchemaNames } from '../common/schema-utils';
import { NOTIFICATION, NotificationContext } from '../components/notifications/NotificationContext';
import { AppContext } from '../App';
import { useMergeState } from '../hooks';
import { PageError } from '../components/PageError';
import { AxiosError } from 'axios';

type Props = RouteComponentProps;


type State = {
  defaultDocument: Document,
  loadingMessage: string | null,
  error: any,
  contacts: Contact[];
  schemas: Schema[];
}

export const CreateDocument: FunctionComponent<Props> = (props) => {

  const [{ defaultDocument, contacts, schemas, loadingMessage, error }, setState] = useMergeState<State>(
    {
      defaultDocument: {
        attributes: {},
      },
      loadingMessage: 'Loading',
      error: null,
      contacts: [],
      schemas: [],
    },
  );

  const {
    history: {
      push,
    },
  } = props;


  const notification = useContext(NotificationContext);
  const { user } = useContext(AppContext);


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
      const contacts = (await httpClient.contacts.list()).data;
      const schemas = (await httpClient.schemas.list({ archived: { $exists: false, $ne: true } })).data;
      setState({
        contacts,
        schemas,
        loadingMessage: null,
      });

    } catch (e) {
      displayPageError(e);
    }
  }, [setState, displayPageError]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const createDocument = async (document: Document) => {
    setState({
      loadingMessage: 'Saving document',
      defaultDocument: document,
    });

    try {
      const doc = (await httpClient.documents.create(document)).data;
      push(documentRoutes.view.replace(':id', doc._id));

    } catch (e) {
      notification.alert({
        type: NOTIFICATION.ERROR,
        title: ' Failed to save document',
        message: (e as AxiosError)!.response!.data.message,
      });
      setState({
        loadingMessage: null,
      });
    }

  };

  const onCancel = () => {
    push(documentRoutes.index);
  };

  if (loadingMessage) {
    return <Preloader message={loadingMessage}/>;
  }

  if (error)
    return <PageError error={error}/>;


  const availableSchemas = mapSchemaNames(user!.schemas, schemas);

  const selectedSchema: Schema | undefined = schemas.find(s => {
    return (
      defaultDocument.attributes &&
      defaultDocument.attributes._schema &&
      s.name === defaultDocument.attributes._schema.value
    );
  });


  return (
    <DocumentForm
      selectedSchema={selectedSchema}
      document={defaultDocument}
      schemas={availableSchemas}
      onSubmit={createDocument}
      contacts={contacts}
      renderHeader={() => {
        return <SecondaryHeader>
          <Box direction="row" gap="small" align="center">
            <Link to={documentRoutes.index} size="large">
              <LinkPrevious/>
            </Link>
            <Heading level="3">
              {'New Document'}
            </Heading>
          </Box>

          <Box direction="row" gap="medium">
            <Button
              onClick={onCancel}
              label="Discard"
            />

            <Button
              type="submit"
              primary
              label="Save"
            />
          </Box>
        </SecondaryHeader>
      }}
    >

    </DocumentForm>
  );

};


export default withRouter(CreateDocument);


