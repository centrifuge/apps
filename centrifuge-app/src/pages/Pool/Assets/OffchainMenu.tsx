import { Loan } from '@centrifuge/centrifuge-js'
import { formatBalance } from '@centrifuge/centrifuge-react'
import {
  Box,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  Menu,
  MenuItem,
  MenuItemGroup,
  Popover,
  Text,
} from '@centrifuge/fabric'
import { useLocation, useNavigate } from 'react-router'
import styled from 'styled-components'
import { nftMetadataSchema } from '../../../../src/schemas'
import { useMetadata } from '../../../../src/utils/useMetadata'
import { useCentNFT } from '../../../../src/utils/useNFTs'

type Props = {
  value: string
  loans: Loan[]
}

type LoanOptionProps = {
  loan: Loan
}

const StyledButton = styled(Box)`
  background: transparent;
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  font-family: Inter, sans-serif;
  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`

const LoanOption = ({ loan }: LoanOptionProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const nft = useCentNFT(loan.asset.collectionId, loan.asset.nftId, false, loan.poolId.startsWith('0x'))
  const { data } = useMetadata(nft?.metadataUri, nftMetadataSchema)

  const handleNavigate = (id: string) => {
    navigate(`${location.pathname}/${id}`)
  }

  const getLabel = () => {
    return (
      <Box display="flex" alignItems="center">
        <Text variant="heading4">{formatBalance('presentValue' in loan ? loan.presentValue : 0)} (USD)</Text>
        <IconChevronRight size={20} />
      </Box>
    )
  }

  return (
    <MenuItemGroup key={loan.id}>
      <MenuItem minHeight={24} label={data?.name} iconRight={getLabel()} onClick={() => handleNavigate(loan.id)} />
    </MenuItemGroup>
  )
}

export const OffchainMenu = ({ value, loans }: Props) => {
  if (!loans.length) return null
  return (
    <Popover
      renderTrigger={(props, ref, state) => (
        <Box ref={ref} alignItems="center" display="flex">
          <StyledButton {...props} as="button">
            <Text variant="heading2">{value}</Text>
            {state.isOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </StyledButton>
        </Box>
      )}
      renderContent={(props, ref) => (
        <Box ref={ref} {...props} width={420}>
          <Menu backgroundColor="white" marginLeft="100px">
            {loans.map((loan) => (
              <LoanOption loan={loan} />
            ))}
          </Menu>
        </Box>
      )}
    />
  )
}
