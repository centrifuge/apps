import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { lastValueFrom } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { IssuerSection } from '../../../components/IssuerSection'
import { PageSection } from '../../../components/PageSection'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { useFile } from '../../../utils/useFile'
import { usePrefetchMetadata } from '../../../utils/useMetadata'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { CreatePoolValues } from '../../IssuerCreatePool'
import { IssuerInput } from '../../IssuerCreatePool/IssuerInput'

type Values = Pick<
  CreatePoolValues,
  'issuerName' | 'issuerLogo' | 'issuerDescription' | 'executiveSummary' | 'website' | 'forum' | 'email'
>

export const Issuer: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const [isEditing, setIsEditing] = React.useState(false)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const prefetchMetadata = usePrefetchMetadata()
  const { data: logoFile } = useFile(metadata?.pool?.issuer?.logo?.uri, 'logo')

  const initialValues: Values = React.useMemo(
    () => ({
      issuerName: metadata?.pool?.issuer?.name ?? '',
      issuerLogo: logoFile ?? null,
      issuerDescription: metadata?.pool?.issuer?.description ?? '',
      executiveSummary: metadata?.pool?.links?.executiveSummary ? 'executiveSummary.pdf' : ('' as any),
      website: metadata?.pool?.links?.website ?? '',
      forum: metadata?.pool?.links?.forum ?? '',
      email: metadata?.pool?.issuer?.email ?? '',
    }),
    [metadata, logoFile]
  )

  const { execute, isLoading } = useCentrifugeTransaction('Update configuration', (cent) => cent.pools.setMetadata, {
    onSuccess: () => {
      setIsEditing(false)
    },
  })

  const form = useFormik({
    initialValues,
    onSubmit: async (values, actions) => {
      const oldMetadata = metadata as PoolMetadata
      const execSummaryChanged = values.executiveSummary !== initialValues.executiveSummary
      const logoChanged = values.issuerLogo !== initialValues.issuerLogo

      if (!hasChanges) {
        setIsEditing(false)
        actions.setSubmitting(false)
        return
      }
      let execSummaryUri
      if (execSummaryChanged) {
        execSummaryUri = (
          await lastValueFrom(cent.metadata.pinFile(await getFileDataURI(values.executiveSummary as File)))
        ).uri
        prefetchMetadata(execSummaryUri)
      }
      let logoUri
      if (logoChanged && values.issuerLogo) {
        logoUri = (await lastValueFrom(cent.metadata.pinFile(await getFileDataURI(values.issuerLogo as File)))).uri
        prefetchMetadata(logoUri)
      }
      const newPoolMetadata: PoolMetadata = {
        ...oldMetadata,
        pool: {
          ...oldMetadata.pool,
          issuer: {
            name: values.issuerName,
            description: values.issuerDescription,
            email: values.email,
            logo:
              logoChanged && logoUri ? { uri: logoUri, mime: values.issuerLogo!.type } : oldMetadata.pool.issuer.logo,
          },
          links: {
            executiveSummary: execSummaryUri
              ? { uri: execSummaryUri, mime: values.executiveSummary!.type }
              : oldMetadata.pool.links.executiveSummary,
            forum: values.forum,
            website: values.website,
          },
        },
      }

      execute([poolId, newPoolMetadata])
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
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const hasChanges = Object.entries(form.values).some(([k, v]) => (initialValues as any)[k] !== v)

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title={`Issuer - ${metadata?.pool?.issuer.name}`}
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
          {isEditing ? <IssuerInput /> : <IssuerSection metadata={metadata} />}
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
