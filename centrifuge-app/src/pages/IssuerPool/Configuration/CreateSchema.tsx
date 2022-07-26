import { Box, Button, TextAreaInput } from '@centrifuge/fabric'
import { Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { Redirect, useHistory, useParams } from 'react-router'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { PageHeader } from '../../../components/PageHeader'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Schema } from '../../../types'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { usePrefetchMetadata } from '../../../utils/useMetadata'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { pinPoolMetadata } from './pinPoolMetadata'

const isValidJsonString = (str: string) => {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

const initialSchemaJSON = `{
  "name":"Example schema",
  "options":{
    "assetClasses":[],
    "loanTypes":[],
    "description":true,
    "image":true
  },
  "sections":[
    {
      "name":"A public data section",
      "public":true,
      "attributes":[
        {
          "label":"Label 1",
          "type":"percentage"
        },
        {
          "label":"Label 2",
          "type":"string",
          "displayType":"single-select",
          "options":["A","B"]
        },
        {
          "label":"Label 3",
          "type":"currency",
          "currencySymbol":"USD",
          "currencyDecimals":18
        },
        {
          "label":"Label 4",
          "type":"timestamp"
        }
      ]
    },
    {
      "name":"A private data section",
      "public":false,
      "attributes":[
        {
          "label":"Label 5",
          "type":"string"
        },
        {
          "label":"Label 6",
          "type":"decimal"
        }
      ]
    }
  ]
}`

export const IssuerPoolCreateSchemaPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreateSchema />
    </PageWithSideBar>
  )
}

export const CreateSchema: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const history = useHistory()
  const prefetchMetadata = usePrefetchMetadata()
  const [redirect, setRedirect] = React.useState('')

  const { execute: updateConfigTx, isLoading } = useCentrifugeTransaction(
    'Create schema',
    (cent) => cent.pools.setMetadata,
    {
      onSuccess: () => {
        setRedirect(`/issuer/${poolId}/configuration`)
      },
    }
  )

  const form = useFormik({
    initialValues: {
      metadata: initialSchemaJSON,
    },
    validate: (values) => {
      let errors: FormikErrors<any> = {}
      if (!isValidJsonString(values.metadata)) {
        errors = setIn(errors, `metadata`, 'Must be a valid JSON string')
      } else {
        const obj: Partial<Schema> = JSON.parse(values.metadata)
        const labels = obj?.sections?.flatMap((section) => section?.attributes.map((attr) => attr?.label)) ?? []
        if (new Set(labels).size < labels.length) {
          errors = setIn(errors, `metadata`, 'Attribute labels must be unique across sections')
        }
      }
      return errors
    },
    onSubmit: async (values, { setSubmitting }) => {
      const schemaMetadataHash = await pinPoolMetadata(values.metadata)
      const newPoolMetadata = {
        ...poolMetadata,
        schemas: [
          ...(poolMetadata?.schemas ?? []),
          {
            id: schemaMetadataHash,
            createdAt: new Date().toISOString(),
          },
        ],
      }

      const metadataHash = await pinPoolMetadata(JSON.stringify(newPoolMetadata))

      prefetchMetadata(metadataHash)
      prefetchMetadata(schemaMetadataHash)

      updateConfigTx([poolId, metadataHash])
      setSubmitting(false)
    },
  })

  if (!poolMetadata) return null

  if (redirect) {
    return <Redirect to={redirect} />
  }

  return (
    <FormikProvider value={form}>
      <Form>
        <PageHeader
          title="Create schema"
          subtitle={poolMetadata?.pool?.name}
          actions={
            <>
              <Button variant="secondary" small onClick={() => history.goBack()}>
                Cancel
              </Button>
              <Button
                type="submit"
                small
                loading={isLoading || form.isSubmitting}
                loadingMessage={isLoading ? 'Pending...' : undefined}
                disabled={!form.isValid}
              >
                Create
              </Button>
            </>
          }
        />
        <Box p={3}>
          <FieldWithErrorMessage name="metadata" as={TextAreaInput} placeholder="{}" rows={20} />
        </Box>
      </Form>
    </FormikProvider>
  )
}
