import { PoolMetadata, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, FileUpload, Stack, Text } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { lastValueFrom } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { PageSection } from '../../../components/PageSection'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { usePool, usePoolMetadata } from '../../../utils/usePools'

type AgreementsUpload = {
  agreements: { [trancheId: string]: File | string | undefined }
}

export const OnboardingSettings: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool) as { data: PoolMetadata }
  const [isEditing, setIsEditing] = React.useState(false)
  const centrifuge = useCentrifuge()

  const { execute: updateConfigTx, isLoading } = useCentrifugeTransaction(
    'Update pool config',
    (cent) => cent.pools.setMetadata,
    {
      onSuccess: () => {
        setIsEditing(false)
      },
    }
  )

  const initialValues: AgreementsUpload = React.useMemo(() => {
    return {
      agreements: (pool.tranches as Token[]).reduce<AgreementsUpload['agreements']>(
        (prevT, currT) => ({
          ...prevT,
          [currT.id]: poolMetadata?.onboarding?.agreements[currT.id].ipfsHash
            ? centrifuge.metadata.parseMetadataUrl(poolMetadata?.onboarding?.agreements[currT.id].ipfsHash)
            : undefined,
        }),
        {}
      ),
    }
  }, [pool, poolMetadata])

  React.useEffect(() => {
    if (isEditing) return
    formik.resetForm()
    formik.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  const formik = useFormik({
    initialValues,
    onSubmit: async (values, actions) => {
      if (!values.agreements || !poolMetadata) {
        return
      }
      let onboardingAgreements: PoolMetadata['onboarding'] = {
        agreements: {},
      }
      for (const [tId, file] of Object.entries(values.agreements)) {
        if (!file || typeof file === 'string') {
          // file hasn't changed
          continue
        }
        const uri = await getFileDataURI(file)
        const pinnedAgreement = await lastValueFrom(centrifuge.metadata.pinFile(uri))
        onboardingAgreements = {
          agreements: {
            ...onboardingAgreements.agreements,
            [tId]: { ipfsHash: pinnedAgreement.ipfsHash },
          },
        }
      }

      const amendedMetadata: PoolMetadata = {
        ...poolMetadata,
        onboarding: onboardingAgreements,
      }
      updateConfigTx([poolId, amendedMetadata])
      actions.setSubmitting(true)
    },
  })

  return (
    <FormikProvider value={formik}>
      <Form>
        <PageSection
          title="Onboarding settings"
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  small
                  loading={formik.isSubmitting}
                  loadingMessage={formik.isSubmitting || isLoading ? 'Pending...' : undefined}
                  key="done"
                  disabled={formik.isSubmitting}
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
          <Stack gap={2}>
            <Text variant="heading4">Subscription documents</Text>
            {Object.entries(formik.values.agreements).map(([tId, agreement]) => {
              return (
                <Box>
                  <FileUpload
                    label={`Subscription document for ${
                      (pool.tranches as Token[])?.find((t) => t.id === tId)?.currency.name
                    }`}
                    onFileChange={async (file) => {
                      console.log('onFileChange', file)
                      formik.setFieldValue('agreements', {
                        ...formik.values.agreements,
                        [tId]: file,
                      })
                    }}
                    placeholder="Choose a file..."
                    disabled={!isEditing || formik.isSubmitting || isLoading}
                    file={agreement}
                    accept="application/pdf"
                  />
                </Box>
              )
            })}
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
