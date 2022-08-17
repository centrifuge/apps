import { Box, Button, TextAreaInput } from '@centrifuge/fabric'
import { Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { PageSection } from '../../../components/PageSection'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { isValidJsonString } from '../../../utils/validation'

type Props = {
  poolId: string
}

export const PoolConfig: React.VFC<Props> = (props: { poolId: string }) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const pool = usePool(props.poolId)
  const { data: metadata } = usePoolMetadata(pool)

  const { execute: updateConfigTx, isLoading } = useCentrifugeTransaction(
    'Update pool config',
    (cent) => cent.pools.setMetadata,
    {
      onSuccess: () => {
        setIsEditing(false)
        form.setFieldValue('metadata', JSON.stringify(metadata, null, 2), false)
      },
    }
  )

  React.useEffect(() => {
    form.setFieldValue('metadata', JSON.stringify(metadata, null, 2), false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata])

  const form = useFormik({
    initialValues: {
      metadata: '',
    },
    validate: (values) => {
      let errors: FormikErrors<any> = {}
      if (!isValidJsonString(values.metadata)) {
        errors = setIn(errors, `metadata`, 'Must be a valid JSON string')
      }
      return errors
    },
    onSubmit: async (values, { setSubmitting }) => {
      console.log('dateta', values.metadata)
      updateConfigTx([props.poolId, JSON.parse(values.metadata)])
      setSubmitting(false)
    },
  })

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Pool config"
          subtitle="Manually edit the pool config (JSON)"
          headerRight={
            isEditing ? (
              <Button
                type="submit"
                small
                loading={isLoading}
                loadingMessage={isLoading ? 'Pending...' : undefined}
                key="done"
              >
                Done
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} small key="edit">
                Edit
              </Button>
            )
          }
        >
          <Box gridColumn="span 6">
            <FieldWithErrorMessage
              name="metadata"
              as={TextAreaInput}
              loading={isLoading || form.isSubmitting}
              placeholder="Description..."
              disabled={!isEditing}
              rows={20}
            />
          </Box>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
