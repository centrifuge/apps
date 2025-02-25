import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Stack, TextAreaInput } from '@centrifuge/fabric'
import { Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { usePoolAdmin, useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { isValidJsonString } from '../../../utils/validation'
import { useDebugFlags } from '../../DebugFlags'
import { FieldWithErrorMessage } from '../../FieldWithErrorMessage'

type Props = {
  poolId: string
}

export function DebugPoolConfig({ poolId }: Props) {
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })
  const poolAdmin = usePoolAdmin(poolId)
  const { editPoolConfig } = useDebugFlags()

  const { execute: updateConfigTx, isLoading } = useCentrifugeTransaction(
    'Update pool config',
    (cent) => cent.pools.setMetadata,
    {
      onSuccess: () => {
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
      updateConfigTx([poolId, JSON.parse(values.metadata)], { account })
      setSubmitting(false)
    },
  })

  return (
    <FormikProvider value={form}>
      <Form>
        <Stack gap={2}>
          <Box gridColumn="span 6">
            <FieldWithErrorMessage
              name="metadata"
              as={TextAreaInput}
              loading={isLoading || form.isSubmitting}
              placeholder="Description..."
              disabled={!poolAdmin || !editPoolConfig}
              rows={20}
            />
          </Box>
          <Button
            type="submit"
            small
            loading={isLoading}
            disabled={!form.dirty}
            loadingMessage={isLoading ? 'Pending...' : undefined}
          >
            Save metadata
          </Button>
        </Stack>
      </Form>
    </FormikProvider>
  )
}
