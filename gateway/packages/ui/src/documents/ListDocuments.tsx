import { canLoadDocument, Document, documentHasNFTs } from '@centrifuge/gateway-lib/models/document'
import { Schema } from '@centrifuge/gateway-lib/models/schema'
import { canCreateDocuments } from '@centrifuge/gateway-lib/models/user'
import { hexToInt } from '@centrifuge/gateway-lib/utils/etherscan'
import { formatDate } from '@centrifuge/gateway-lib/utils/formaters'
import { getSchemaLabel } from '@centrifuge/gateway-lib/utils/schema-utils'
import { Box, Button, Heading } from 'grommet'
import { FormNext } from 'grommet-icons'
import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react'
import { RouteComponentProps, withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { AppContext } from '../App'
import { DataTableWithDynamicHeight } from '../components/DataTableWithDynamicHeight'
import { PageError } from '../components/PageError'
import { Preloader } from '../components/Preloader'
import { SecondaryHeader } from '../components/SecondaryHeader'
import { POLLING_INTERVAL } from '../constants'
import { useMergeState } from '../hooks'
import { httpClient } from '../http-client'
import documentRoutes from './routes'

type Props = RouteComponentProps

type State = {
  documents: Document[]
  schemas: Schema[]
  loadingMessage: string | null
  error: any
}

let timeoutRef

export const ListDocuments: FunctionComponent<Props> = (props: Props) => {
  const {
    history: { push },
  } = props

  const [{ loadingMessage, documents, schemas, error }, setState] = useMergeState<State>({
    documents: [],
    schemas: [],
    loadingMessage: 'Loading',
    error: null,
  })

  const { user } = useContext(AppContext)

  const displayPageError = useCallback(
    (error) => {
      setState({
        loadingMessage: null,
        error,
      })
    },
    [setState]
  )

  const loadData = useCallback(
    async (inBg: boolean = false) => {
      setState({
        loadingMessage: inBg ? null : 'Loading',
      })
      try {
        const documents = (await httpClient.documents.list()).data
        //get All schemas. We need to display even archived ones
        const schemas = (await httpClient.schemas.list()).data
        setState({
          loadingMessage: null,
          schemas,
          documents,
        })
      } catch (e) {
        !inBg && displayPageError(e)
      }

      timeoutRef = setTimeout(() => {
        loadData(true)
      }, POLLING_INTERVAL)
    },
    [setState, displayPageError]
  )

  const getFilteredDocuments = () => {
    return documents.map((doc: any) => {
      return {
        ...doc,
        // Datable does not have support for nested props ex data.myValue
        // We need make the props accessible top level and we use a special
        // prefix in order to avoid overriding some prop
        $_reference_id: doc.attributes.reference_id && doc.attributes.reference_id.value,
        $_schema: doc.attributes._schema && getSchemaLabel(doc.attributes._schema.value, schemas),
      }
    })
  }

  useEffect(() => {
    loadData()
    return () => {
      clearTimeout(timeoutRef)
    }
  }, [loadData])

  if (loadingMessage) {
    return <Preloader message={loadingMessage} />
  }

  if (error) {
    return <PageError error={error} />
  }

  return (
    <Box>
      <SecondaryHeader>
        <Box direction={'row'} gap={'medium'} align="center">
          <Heading level="3">Documents</Heading>
        </Box>
        <Link to={documentRoutes.new}>{canCreateDocuments(user!) && <Button primary label="Create Document" />}</Link>
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        <DataTableWithDynamicHeight
          sortable={true}
          data={getFilteredDocuments()}
          onClickRow={({ datum }) => {
            if (!canLoadDocument(datum as Document)) return
            push(documentRoutes.view.replace(':id', (datum as Document)._id!))
          }}
          primaryKey={'_id'}
          columns={[
            {
              property: '$_reference_id',
              header: 'Reference ID',
              sortable: true,
            },

            {
              property: '$_schema',
              header: 'Schema',
              sortable: true,
            },
            {
              property: 'createdAt',
              header: 'Date created',
              sortable: true,
              render: (datum) => formatDate((datum as Document).createdAt, true),
            },
            {
              property: 'document_status',
              header: 'Document Status',
              sortable: true,
            },
            {
              property: 'nft_status',
              header: 'NFT ID',
              sortable: true,
              render: (datum) => {
                if (documentHasNFTs(datum as Document)) {
                  return (datum as Document).header!.nfts!.map((nft) => hexToInt(nft.token_id!)).join(', ')
                }
                return (datum as Document).nft_status
              },
            },
            {
              header: '',
              property: 'id',
              align: 'center',
              sortable: false,
              size: '36px',
              render: (datum) => {
                return canLoadDocument(datum as Document) ? (
                  <Box>
                    <FormNext />
                  </Box>
                ) : (
                  <></>
                )
              },
            },
          ]}
        />
      </Box>
    </Box>
  )
}

export default withRouter(ListDocuments)
