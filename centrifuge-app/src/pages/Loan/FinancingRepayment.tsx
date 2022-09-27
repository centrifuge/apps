import * as React from 'react'
import { LabelValueStack } from '../../components/LabelValueStack'

export const FinancingRepayment: React.FC<{
  drawDownDate: string | null
  closingDate: string | null
  totalFinanced: string
  totalRepaid: string
}> = ({ drawDownDate, closingDate, totalFinanced, totalRepaid }) => {
  return (
    <>
      {!!drawDownDate && <LabelValueStack label="1st drawdown date" value={drawDownDate} />}
      {!!closingDate && <LabelValueStack label="Date Closed" value={closingDate} />}
      <LabelValueStack label="Total financed" value={totalFinanced} />
      <LabelValueStack label="Total repaid" value={totalRepaid} />
    </>
  )
}
