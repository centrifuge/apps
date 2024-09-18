import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Stack } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { lastValueFrom } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { IssuerDetails, RatingDetails, ReportDetails } from '../../../components/IssuerSection'
import { PageSection } from '../../../components/PageSection'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { useFile } from '../../../utils/useFile'
import { usePrefetchMetadata } from '../../../utils/useMetadata'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { CreatePoolValues } from '../../IssuerCreatePool'
import { IssuerInput } from '../../IssuerCreatePool/IssuerInput'
import { PoolRatingInput } from '../../IssuerCreatePool/PoolRatingInput'
import { PoolReportsInput } from '../../IssuerCreatePool/PoolReportsInput'

type Values = Pick<
  CreatePoolValues,
  | 'issuerName'
  | 'issuerRepName'
  | 'issuerLogo'
  | 'issuerDescription'
  | 'issuerShortDescription'
  | 'issuerCategories'
  | 'executiveSummary'
  | 'website'
  | 'forum'
  | 'email'
  | 'details'
  | 'reportUrl'
  | 'reportAuthorName'
  | 'reportAuthorTitle'
  | 'ratingAgency'
  | 'ratingValue'
  | 'ratingReportUrl'
> & {
  reportAuthorAvatar: string | null | File
}

export function Issuer() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const [isEditing, setIsEditing] = React.useState(false)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const prefetchMetadata = usePrefetchMetadata()
  const { data: logoFile } = useFile(metadata?.pool?.issuer?.logo?.uri, 'logo')
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })

  const initialValues: Values = React.useMemo(
    () => ({
      issuerName: metadata?.pool?.issuer?.name ?? '',
      issuerRepName: metadata?.pool?.issuer?.repName ?? '',
      issuerLogo: logoFile ?? null,
      issuerDescription: metadata?.pool?.issuer?.description ?? '',
      issuerShortDescription: metadata?.pool?.issuer?.shortDescription ?? '',
      executiveSummary: metadata?.pool?.links?.executiveSummary ? 'executiveSummary.pdf' : ('' as any),
      website: metadata?.pool?.links?.website ?? '',
      forum: metadata?.pool?.links?.forum ?? '',
      email: metadata?.pool?.issuer?.email ?? '',
      details: metadata?.pool?.details,
      reportUrl: metadata?.pool?.reports?.[0]?.uri ?? '',
      reportAuthorName: metadata?.pool?.reports?.[0]?.author?.name ?? '',
      reportAuthorTitle: metadata?.pool?.reports?.[0]?.author?.title ?? '',
      reportAuthorAvatar: metadata?.pool?.reports?.[0]?.author?.avatar
        ? `avatar.${metadata.pool.reports[0].author.avatar.mime?.split('/')[1]}`
        : null,
      ratingAgency: metadata?.pool?.rating?.ratingAgency ?? '',
      ratingValue: metadata?.pool?.rating?.ratingValue ?? '',
      ratingReportUrl: metadata?.pool?.rating?.ratingReportUrl ?? '',
      issuerCategories: metadata?.pool?.issuerCategories ?? [{ type: '', value: '' }],
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
            repName: values.issuerRepName,
            description: values.issuerDescription,
            email: values.email,
            logo:
              logoChanged && logoUri ? { uri: logoUri, mime: values.issuerLogo!.type } : oldMetadata.pool.issuer.logo,
            shortDescription: values.issuerShortDescription,
          },
          links: {
            executiveSummary: execSummaryUri
              ? { uri: execSummaryUri, mime: values.executiveSummary!.type }
              : oldMetadata.pool.links.executiveSummary,
            forum: values.forum,
            website: values.website,
          },
          details: values.details,
          rating: {
            ratingAgency: values.ratingAgency,
            ratingValue: values.ratingValue,
            ratingReportUrl: values.ratingReportUrl,
          },
        },
      }

      if (values.reportUrl) {
        let avatar = null
        const avatarChanged = values.reportAuthorAvatar !== initialValues.reportAuthorAvatar
        if (avatarChanged && values.reportAuthorAvatar) {
          const pinned = await lastValueFrom(
            cent.metadata.pinFile(await getFileDataURI(values.reportAuthorAvatar as File))
          )
          avatar = { uri: pinned.uri, mime: (values.reportAuthorAvatar as File).type }
        }
        newPoolMetadata.pool.reports = [
          {
            author: {
              avatar: avatar,
              name: values.reportAuthorName,
              title: values.reportAuthorTitle,
            },
            uri: values.reportUrl,
          },
        ]
      }

      execute([poolId, newPoolMetadata], { account })
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
          title={`Issuer details`}
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
            <Stack gap={3}>
              <IssuerInput />
              <PoolReportsInput />
              <PoolRatingInput />
            </Stack>
          ) : (
            <Stack gap={2}>
              <IssuerDetails metadata={metadata} />
              {metadata?.pool?.reports?.[0] && <ReportDetails metadata={metadata} />}
              {metadata?.pool?.rating && <RatingDetails metadata={metadata} />}
            </Stack>
          )}
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
