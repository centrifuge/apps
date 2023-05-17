import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, FileUpload, Stack } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { lastValueFrom } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { PageSection } from '../../../components/PageSection'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { usePool, usePoolMetadata } from '../../../utils/usePools'

type AgreementsUpload = {
  agreements: { trancheId: string; file: File }[]
}

const initialValues: AgreementsUpload = {
  agreements: [],
}

export const OnboardingConfig: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool) as { data: PoolMetadata }
  const [isEditing, setIsEditing] = React.useState(false)
  const centrifuge = useCentrifuge()

  const { execute: updateConfigTx } = useCentrifugeTransaction('Update pool config', (cent) => cent.pools.setMetadata, {
    onSuccess: () => {
      setIsEditing(false)
    },
  })

  const form = useFormik({
    initialValues,
    onSubmit: async (values, actions) => {
      if (!values.agreements || !poolMetadata) {
        return
      }
      let onboardingAgreements: PoolMetadata['onboarding'] = {
        agreements: {},
      }
      for (const i of values.agreements) {
        const uri = await getFileDataURI(i.file)
        const pinnedAgreement = await lastValueFrom(centrifuge.metadata.pinFile(uri))
        onboardingAgreements = {
          agreements: {
            ...onboardingAgreements.agreements,
            [i.trancheId]: { ipfsHash: pinnedAgreement.ipfsHash },
          },
        }
      }

      const amendedMetadata: PoolMetadata = {
        ...poolMetadata,
        onboarding: onboardingAgreements,
      }
      updateConfigTx([poolId, amendedMetadata])
      actions.setSubmitting(false)
    },
  })

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Onboarding configuration"
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  small
                  loading={form.isSubmitting}
                  loadingMessage={form.isSubmitting ? 'Pending...' : undefined}
                  key="done"
                  disabled={form.isSubmitting}
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
            {pool.tranches.map((tranche) => {
              return (
                <FileUpload
                  key={tranche.id}
                  disabled={!isEditing}
                  file={
                    poolMetadata?.onboarding?.agreements[tranche.id].ipfsHash ??
                    form.values.agreements?.find((a) => a?.trancheId === tranche.id)?.file ??
                    null
                  }
                  onFileChange={(file) => {
                    if (file && !form.values.agreements.find((a) => a?.trancheId === tranche.id)) {
                      form.setFieldValue('agreements', [
                        ...form.values.agreements,
                        { trancheId: tranche.id, file: file },
                      ])
                    }
                  }}
                  accept="application/pdf"
                  label={`Upload a pdf subscription agreement for ${tranche.currency.symbol}`}
                  placeholder="Choose a file..."
                />
              )
            })}
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
