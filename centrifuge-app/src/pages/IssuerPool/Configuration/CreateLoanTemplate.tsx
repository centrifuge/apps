import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, TextAreaInput } from '@centrifuge/fabric'
import { Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { Redirect, useHistory, useParams } from 'react-router'
import { lastValueFrom } from 'rxjs'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { PageHeader } from '../../../components/PageHeader'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { LoanTemplate } from '../../../types'
import { usePrefetchMetadata } from '../../../utils/useMetadata'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { isValidJsonString } from '../../../utils/validation'

const initialSchemaJSON = `{
  "name":"Example asset template",
  "options":{
    "assetClasses":[],
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
          "currencyDecimals": 6
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

export const IssuerPoolCreateLoanTemplatePage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreateLoanTemplate />
    </PageWithSideBar>
  )
}

export const CreateLoanTemplate: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const history = useHistory()
  const prefetchMetadata = usePrefetchMetadata()
  const [redirect, setRedirect] = React.useState('')
  const cent = useCentrifuge()

  const { execute: updateConfigTx, isLoading } = useCentrifugeTransaction(
    'Create asset template',
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
        const obj: Partial<LoanTemplate> = JSON.parse(values.metadata)
        const labels = obj?.sections?.flatMap((section) => section?.attributes.map((attr) => attr?.label)) ?? []
        if (new Set(labels).size < labels.length) {
          errors = setIn(errors, `metadata`, 'Attribute labels must be unique across sections')
        }
      }
      return errors
    },
    onSubmit: async (values, { setSubmitting }) => {
      const templateMetadataHash = await lastValueFrom(cent.metadata.pinJson(JSON.parse(values.metadata)))
      const newPoolMetadata = {
        ...(poolMetadata as PoolMetadata),
        loanTemplates: [
          ...(poolMetadata?.loanTemplates ?? []),
          {
            id: templateMetadataHash.ipfsHash,
            createdAt: new Date().toISOString(),
          },
        ],
      }

      prefetchMetadata(templateMetadataHash.ipfsHash)

      updateConfigTx([poolId, newPoolMetadata])
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
          title="Create asset template"
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
