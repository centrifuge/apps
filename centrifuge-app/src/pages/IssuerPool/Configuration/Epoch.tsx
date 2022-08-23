import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { Button, Grid, NumberInput } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { PageSection } from '../../../components/PageSection'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { useConstants, usePool } from '../../../utils/usePools'
import { validate } from '../../IssuerCreatePool/validate'

type Values = Pick<PoolMetadataInput, 'epochHours' | 'epochMinutes'>

export const Epoch: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const [isEditing, setIsEditing] = React.useState(false)
  const pool = usePool(poolId)

  const consts = useConstants()

  const epochHours = Math.floor((pool?.parameters.minEpochTime ?? 0) / 3600)
  const epochMinutes = Math.floor(((pool?.parameters.minEpochTime ?? 0) / 60) % 60)
  const initialValues: Values = React.useMemo(() => {
    return {
      epochHours,
      epochMinutes,
    }
  }, [epochHours, epochMinutes])

  const { execute, isLoading } = useCentrifugeTransaction('Update configuration', (cent) => cent.pools.updatePool, {
    onSuccess: () => {
      setIsEditing(false)
    },
  })

  const form = useFormik({
    initialValues,
    onSubmit: async (values, actions) => {
      if (!hasChanges) {
        setIsEditing(false)
        actions.setSubmitting(false)
        return
      }

      const epochSeconds = ((values.epochHours as number) * 60 + (values.epochMinutes as number)) * 60
      execute([poolId, { minEpochTime: { newValue: epochSeconds } }])
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  React.useEffect(() => {
    form.resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const hasChanges = Object.entries(form.values).some(([k, v]) => (initialValues as any)[k] !== v)

  const delay = consts?.minUpdateDelay ? consts.minUpdateDelay / (60 * 60 * 24) : null

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Epoch"
          subtitle={
            delay
              ? `A change Takes ${
                  delay < 0.5 ? `${Math.ceil(delay / 24)} hours` : `${Math.round(delay)} days`
                } to take effect`
              : undefined
          }
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  small
                  loading={isLoading || form.isSubmitting}
                  loadingMessage={isLoading || form.isSubmitting ? 'Pending...' : undefined}
                  key="done"
                  disabled={!hasChanges}
                >
                  Done
                </Button>
              </ButtonGroup>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} small key="edit">
                Edit
              </Button>
            )
          }
        >
          {isEditing ? (
            <Grid columns={[1, 2, 2]} equalColumns gap={2} rowGap={3}>
              <FieldWithErrorMessage
                validate={validate.epochHours}
                name="epochHours"
                as={NumberInput}
                label="Epoch hours*"
                maxLength={2}
                rightElement="hrs"
              />
              <FieldWithErrorMessage
                validate={validate.epochMinutes}
                name="epochMinutes"
                as={NumberInput}
                label="Epoch minutes*"
                maxLength={2}
                rightElement="min"
              />
            </Grid>
          ) : (
            <LabelValueStack
              label="Minimum epoch duration"
              value={epochHours === 0 ? `${epochMinutes} minutes` : `${epochHours} hours and ${epochMinutes} minutes`}
            />
          )}
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
