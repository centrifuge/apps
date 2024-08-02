import { ActiveLoan, Loan } from '@centrifuge/centrifuge-js'
import { Select } from '@centrifuge/fabric'
import { nftMetadataSchema } from '../../schemas'
import { useLoans } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useBorrower } from '../../utils/usePermissions'

type SourceSelectProps = {
  loan: Loan
  value: 'reserve' | 'other' | string
  onChange: (option: string) => void
  action: 'repay' | 'finance'
}

export function SourceSelect({ loan, value, onChange, action }: SourceSelectProps) {
  const unfilteredLoans = useLoans(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)

  // acceptable options are active loans with cash valuation ONLY if connected account is the borrower
  const loans = unfilteredLoans?.filter(
    (l) =>
      l.id !== loan.id &&
      l.status !== 'Closed' &&
      (l as ActiveLoan).borrower === account?.actingAddress &&
      'valuationMethod' in l.pricing &&
      l.pricing.valuationMethod === 'cash'
  ) as Loan[] | undefined

  const options = [
    { label: 'Onchain reserve', value: 'reserve' },
    ...(loans?.map((l) => ({ value: l.id, label: <LoanOption loan={l as Loan} key={l.id} /> })) ?? []),
  ]
  if (loan.pricing.valuationMethod === 'cash') {
    options.push({ label: 'Other', value: 'other' })
  }

  return (
    <Select
      label={action === 'finance' ? 'Source' : 'Destination'}
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function LoanOption({ loan }: { loan: Loan }) {
  const nft = useCentNFT(loan.asset.collectionId, loan.asset.nftId, false, false)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  return (
    <>
      {loan.id} - {metadata?.name}
    </>
  )
}
