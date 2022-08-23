import { Rate, WriteOffGroup } from '@centrifuge/centrifuge-js'
import { Box, Button, Stack } from '@centrifuge/fabric'
import { FieldArray, Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Column, DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { formatPercentage } from '../../../utils/formatting'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { useConstants, useWriteOffGroups } from '../../../utils/usePools'
import { WriteOffInput } from './WriteOffInput'

export type Row = WriteOffGroup

type WriteOffGroupInput = {
  days: number | ''
  writeOff: number | ''
  penaltyInterest: number | ''
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Days after expected repayment date',
    cell: (row: Row) => row.overdueDays,
    flex: '3',
  },
  {
    align: 'right',
    header: 'Write-off',
    cell: (row: Row) => formatPercentage(row.percentage.toPercent()),
    flex: '3',
  },
  {
    align: 'right',
    header: 'Penalty fee',
    cell: (row: Row) => formatPercentage(row.penaltyInterestRate.toAprPercent()),
    flex: '3',
  },
]

const createEmptyWriteOffGroup = (): WriteOffGroupInput => ({
  days: '',
  writeOff: '',
  penaltyInterest: '',
})

export type WriteOffGroupValues = { writeOffGroups: WriteOffGroupInput[] }

export const WriteOffGroups: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const consts = useConstants()

  const savedGroups = useWriteOffGroups(poolId)
  const sortedSavedGroups = [...(savedGroups ?? [])].sort((a, b) => a.overdueDays - b.overdueDays)

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update configuration',
    (cent) => cent.pools.addWriteOffGroups,
    {}
  )

  const form = useFormik<WriteOffGroupValues>({
    initialValues: { writeOffGroups: [] },
    validate: (values) => {
      let errors: FormikErrors<any> = {}
      const writeOffGroups = [
        ...(savedGroups ?? []).map((g) => ({
          days: g.overdueDays,
          writeOff: g.percentage.toPercent().toNumber(),
          penaltyInterest: g.penaltyInterestRate.toAprPercent().toNumber(),
          saved: true,
        })),
        ...values.writeOffGroups,
      ]
        .filter((g) => typeof g.days === 'number')
        .sort((a, b) => (a.days as number) - (b.days as number))
      let highestWriteOff = 0
      let highestPenalty = 0
      let previousDays = -1
      writeOffGroups.forEach((g) => {
        if (g.writeOff <= highestWriteOff) {
          let index = values.writeOffGroups.findIndex((gr) => gr.days === g.days && gr.writeOff === g.writeOff)
          index = index === -1 ? 0 : index
          errors = setIn(
            errors,
            `writeOffGroups.${index}.writeOff`,
            'Write-off percentage must increase as days increase'
          )
        } else {
          highestWriteOff = g.writeOff as number
        }

        if (g.penaltyInterest < highestPenalty) {
          let index = values.writeOffGroups.findIndex((gr) => gr.days === g.days && gr.writeOff === g.writeOff)
          index = index === -1 ? 0 : index
          errors = setIn(
            errors,
            `writeOffGroups.${index}.penaltyInterest`,
            'Penalty fee rate must stay equal or increase as days increase'
          )
        } else {
          highestPenalty = g.penaltyInterest as number
        }

        if (g.days === previousDays) {
          const index = values.writeOffGroups.findIndex((gr) => gr.days === g.days && gr.writeOff === g.writeOff)
          errors = setIn(errors, `writeOffGroups.${index}.days`, 'Days must be unique')
        }
        previousDays = g.days as number
      })
      if (highestWriteOff !== 100) {
        errors = setIn(
          errors,
          `writeOffGroups.${values.writeOffGroups.length - 1}.writeOff`,
          'Must have one group with 100% write-off'
        )
      }

      return errors
    },
    onSubmit: async (values, actions) => {
      const writeOffGroups = values.writeOffGroups.map((g) => ({
        overdueDays: g.days as number,
        percentage: Rate.fromPercent(g.writeOff),
        penaltyInterestRate: Rate.fromAprPercent(g.penaltyInterest),
      }))
      execute([poolId, writeOffGroups])
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    form.resetForm()
    form.setValues({ writeOffGroups: [] }, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedGroups])

  const addButton = (
    <FieldArray name="writeOffGroups">
      {(fldArr) => (
        <Button
          variant="secondary"
          onClick={() => {
            fldArr.push(createEmptyWriteOffGroup())
          }}
          small
          key="edit"
          disabled={(savedGroups?.length ?? 0) + form.values.writeOffGroups.length >= (consts?.maxWriteOffGroups ?? 5)}
        >
          {(savedGroups?.length ?? 0) + form.values.writeOffGroups.length > 0 ? 'Add another' : 'Add'}
        </Button>
      )}
    </FieldArray>
  )

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Write-off schedule"
          subtitle="At least one write-off activity is required"
          headerRight={
            <>
              {form.values.writeOffGroups.length === 0 && addButton}
              {form.values.writeOffGroups.length > 0 && (
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
            <DataTable data={sortedSavedGroups} columns={columns} />
            <WriteOffInput />
            <Box>{form.values.writeOffGroups.length > 0 && addButton}</Box>
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
