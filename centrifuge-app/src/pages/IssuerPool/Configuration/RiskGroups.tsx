import { PoolMetadata, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Stack } from '@centrifuge/fabric'
import { FieldArray, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Column, DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { formatPercentage } from '../../../utils/formatting'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { createEmptyRiskGroup, RiskGroupInput } from '../../IssuerCreatePool'
import { RiskGroupsInput } from '../../IssuerCreatePool/RiskGroupsInput'

export type Row = PoolMetadata['riskGroups'][0]

const MAX_GROUPS = 100

const columns: Column[] = [
  {
    align: 'left',
    header: '',
    cell: (row: Row, i) => i + 1,
    flex: '1',
  },
  {
    align: 'left',
    header: 'Name',
    cell: (row: Row) => row.name,
    flex: '3',
  },
  {
    align: 'right',
    header: 'Advance rate',
    cell: (row: Row) => formatPercentage(new Rate(row.advanceRate).toPercent()),
    flex: '2',
  },
  {
    align: 'right',
    header: 'Financing fee',
    cell: (row: Row) => formatPercentage(new Rate(row.interestRatePerSec).toAprPercent()),
    flex: '2',
  },
  {
    align: 'right',
    header: 'Prob. of def.',
    cell: (row: Row) => formatPercentage(new Rate(row.probabilityOfDefault).toPercent()),
    flex: '2',
  },
  {
    align: 'right',
    header: 'Loss given def.',
    cell: (row: Row) => formatPercentage(new Rate(row.lossGivenDefault).toPercent()),
    flex: '2',
  },
  {
    align: 'right',
    header: 'Risk adjustment',
    cell: (row: Row) =>
      formatPercentage(
        new Rate(row.probabilityOfDefault).toDecimal().mul(new Rate(row.lossGivenDefault).toDecimal().mul(100))
      ),
    flex: '2',
  },
  {
    align: 'right',
    header: 'Discount rate',
    cell: (row: Row) => formatPercentage(new Rate(row.discountRate).toAprPercent()),
    flex: '2',
  },
]

export type RiskGroupValues = { riskGroups: RiskGroupInput[] }

export const RiskGroups: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)

  const { data: metadata } = usePoolMetadata(pool)
  const savedGroups = metadata?.riskGroups

  const { execute, isLoading } = useCentrifugeTransaction('Update configuration', (cent) => cent.pools.setMetadata)

  const form = useFormik<RiskGroupValues>({
    initialValues: { riskGroups: [] },
    onSubmit: async (values, actions) => {
      const oldMetadata = metadata as PoolMetadata
      const addedRiskGroups = values.riskGroups.map((g) => ({
        name: g.groupName,
        advanceRate: Rate.fromPercent(g.advanceRate).toString(),
        interestRatePerSec: Rate.fromAprPercent(g.fee).toString(),
        probabilityOfDefault: Rate.fromPercent(g.probabilityOfDefault).toString(),
        lossGivenDefault: Rate.fromPercent(g.lossGivenDefault).toString(),
        discountRate: Rate.fromAprPercent(g.discountRate).toString(),
      }))

      const newPoolMetadata: PoolMetadata = {
        ...oldMetadata,
        riskGroups: [...oldMetadata.riskGroups, ...addedRiskGroups],
      }
      execute([poolId, newPoolMetadata])
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    form.resetForm()
    form.setValues({ riskGroups: [] }, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedGroups])

  const addButton = (
    <FieldArray name="riskGroups">
      {(fldArr) => (
        <Button
          variant="secondary"
          onClick={() => {
            fldArr.push(createEmptyRiskGroup())
          }}
          small
          key="edit"
          disabled={(savedGroups?.length ?? 0) + form.values.riskGroups.length >= MAX_GROUPS}
        >
          {(savedGroups?.length ?? 0) + form.values.riskGroups.length > 0 ? 'Add another' : 'Add'}
        </Button>
      )}
    </FieldArray>
  )

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Risk groups"
          headerRight={
            <>
              {form.values.riskGroups.length === 0 && addButton}
              {form.values.riskGroups.length > 0 && (
                <ButtonGroup variant="small">
                  <Button variant="secondary" onClick={() => form.resetForm()} small>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    small
                    loading={isLoading || form.isSubmitting}
                    loadingMessage={isLoading || form.isSubmitting ? 'Pending...' : undefined}
                    key="done"
                  >
                    Done
                  </Button>
                </ButtonGroup>
              )}
            </>
          }
        >
          <Stack gap={3}>
            <DataTable data={savedGroups ?? []} columns={columns} />
            <RiskGroupsInput startIndex={savedGroups?.length} />
            <Box>{form.values.riskGroups.length > 0 && addButton}</Box>
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
