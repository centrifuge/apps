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
import { useMetadata, usePrefetchMetadata } from '../../../utils/useMetadata'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { isValidJsonString } from '../../../utils/validation'

const initialSchemaJSON = `{
  "options": {
    "description": true,
    "image": true
  },
  "attributes": {
    "key1": {
      "label": "string value",
      "type": {
        "primitive": "string",
        "statistics": "categorical",
        "constructor": "String"
      },
      "input": {
        "type": "text"
      },
      "output": null,
      "public": true
    },
    "key2": {
      "label": "number value",
      "type": {
        "primitive": "number",
        "statistics": "categorical",
        "constructor": "Number"
      },
      "input": {
        "type": "number",
        "unit": "%",
        "min": 0,
        "max": 100
      },
      "output": null,
      "public": false
    },
    "key3": {
      "label": "a date",
      "type": {
        "primitive": "string",
        "statistics": "continuous",
        "constructor": "Date"
      },
      "input": {
        "type": "date"
      },
      "output": null,
      "public": true
    },
    "key4": {
      "label": "a currency value",
      "type": {
        "primitive": "string",
        "statistics": "continuous",
        "constructor": "Number"
      },
      "input": {
        "type": "currency",
        "symbol": "USD"
      },
      "output": null,
      "public": true
    },
    "key5": {
      "label": "A or B",
      "type": {
        "primitive": "string",
        "statistics": "categorical",
        "constructor": "String"
      },
      "input": {
        "type": "single-select",
        "options": ["A", "B"]
      },
      "output": null,
      "public": true
    }
  },
  "sections": [
    {
      "name": "A public data section",
      "attributes": [
        "key1",
        "key3",
        "key4",
        "key5" 
      ]
    },
    {
      "name": "A private data section",
      "attributes": [
        "key2"
      ]
    }
  ]
}`

export function IssuerPoolCreateLoanTemplatePage() {
  return (
    <PageWithSideBar>
      <CreateLoanTemplate />
    </PageWithSideBar>
  )
}

export function CreateLoanTemplate() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const history = useHistory()
  const prefetchMetadata = usePrefetchMetadata()
  const [redirect, setRedirect] = React.useState('')
  const cent = useCentrifuge()
  const { data: lastTemplateVersion } = useMetadata<LoanTemplate>(poolMetadata?.loanTemplates?.at(-1)?.id)
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })

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
        const allSameVisibility = obj.sections?.every((section) =>
          section.attributes.every((key) => {
            const isPublic = obj.attributes?.[section.attributes[0]]?.public
            const attr = obj.attributes?.[key]
            return !!attr?.public === !!isPublic
          })
        )
        if (!allSameVisibility) {
          errors = setIn(errors, `metadata`, 'Attributes in a section must all be public or all be not public')
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

      updateConfigTx([poolId, newPoolMetadata], { account })
      setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (!lastTemplateVersion) return
    form.resetForm()
    form.setValues({ metadata: JSON.stringify(lastTemplateVersion, null, 2) }, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTemplateVersion])

  if (!poolMetadata || (poolMetadata.loanTemplates?.[0] && !lastTemplateVersion)) return null

  const isUpdating = !!poolMetadata.loanTemplates?.[0]

  if (redirect) {
    return <Redirect to={redirect} />
  }

  return (
    <FormikProvider value={form}>
      <Form>
        <PageHeader
          title={`Version ${(poolMetadata.loanTemplates?.length ?? 0) + 1}`}
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
                {isUpdating ? 'Update' : 'Create'}
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
