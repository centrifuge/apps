import { LabelValueStack } from '../../components/LabelValueStack'

export function FinancingRepayment({
  drawDownDate,
  closingDate,
  outstandingPrincipal,
  outstandingInterest,
  repaidPrincipal,
  repaidInterest,
  repaidUnscheduled,
}: {
  drawDownDate: string | null
  closingDate: string | null
  outstandingPrincipal: string
  outstandingInterest: string
  repaidPrincipal: string
  repaidInterest: string
  repaidUnscheduled: string | null
}) {
  return (
    <>
      {!!drawDownDate && <LabelValueStack label="1st drawdown date" value={drawDownDate} />}
      {!!closingDate && <LabelValueStack label="Date closed" value={closingDate} />}
      <LabelValueStack label="Principal outstanding" value={outstandingPrincipal} />
      <LabelValueStack label="Interest outstanding" value={outstandingInterest} />
      <LabelValueStack label="Principal paid" value={repaidPrincipal} />
      <LabelValueStack label="Interest paid" value={repaidInterest} />
      {!!repaidUnscheduled && <LabelValueStack label="Unscheduled repayments" value={repaidUnscheduled} />}
    </>
  )
}
