import { Loan } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { nftMetadataSchema } from '../schemas'
import { useMetadata } from '../utils/useMetadata'
import { useNFT } from '../utils/useNFTs'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { DataTable } from './DataTable'
import LoanLabel from './LoanLabel'

type Props = {
  loans: Loan[]
  onLoanClicked: (loan: Loan) => void
}

export const LoanList: React.FC<Props> = ({ loans, onLoanClicked }) => {
  const columns = [
    {
      align: 'left',
      header: 'Name',
      cell: (l: Loan) => <AssetName loan={l} />,
    },
    {
      align: 'left',
      header: 'Description',
      cell: (l: Loan) => <AssetDescription loan={l} />,
      flex: '2 1 250px',
    },
    {
      align: 'left',
      header: 'Pool',
      cell: (l: Loan) => <PoolName loan={l} />,
    },
    {
      align: 'left',
      header: 'NFT ID',
      cell: (l: Loan) => <Text variant="body2">{shorten(l.asset.nftId, 4)}</Text>,
      flex: '1 1 100px',
    },
    {
      align: 'left',
      header: 'Status',
      cell: (l: Loan) => <LoanLabel loan={l} />,
      flex: '1 1 100px',
    },
    {
      header: '',
      cell: () => <IconChevronRight size={24} color="textPrimary" />,
      flex: '0 0 72px',
    },
  ]

  return <DataTable data={loans} columns={columns} onRowClicked={onLoanClicked} />
}

const AssetName: React.VFC<{ loan: Loan }> = ({ loan }) => {
  const nft = useNFT(loan.asset.collectionId, loan.asset.nftId)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  return (
    <Text variant="body2" fontWeight={600}>
      {metadata?.name || 'Unnamed asset'}
    </Text>
  )
}

const AssetDescription: React.VFC<{ loan: Loan }> = ({ loan }) => {
  const nft = useNFT(loan.asset.collectionId, loan.asset.nftId)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  return <Text variant="body2">{metadata?.description}</Text>
}

const PoolName: React.VFC<{ loan: Loan }> = ({ loan }) => {
  const pool = usePool(loan.poolId)
  const { data } = usePoolMetadata(pool)
  return <Text variant="body2">{data?.pool?.name}</Text>
}

const shorten = (addr: string, visibleChars: number) =>
  `${addr.substr(0, visibleChars)}...${addr.substr(addr.length - visibleChars)}`
