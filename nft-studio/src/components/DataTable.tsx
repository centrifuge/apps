import { Shelf } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

interface DataTableProps {
  children: React.ReactNode | React.ReactNode[]
}

const StyledDataTable = styled.div`
  width: 100%;
  border: 0;
  font-family: sans-serif;
`

export const DataTable: React.FC<DataTableProps> = ({ children }) => <StyledDataTable>{children}</StyledDataTable>

interface DataTableRowProps {
  children: React.ReactNode | React.ReactNode[]
}

const StyledDataTableRow = styled.div`
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`

export const DataTableRow: React.FC<DataTableRowProps> = ({ children }) => (
  <StyledDataTableRow>
    <Shelf justifyContent="space-between">{children}</Shelf>
  </StyledDataTableRow>
)

interface DataTableColProps {
  children: React.ReactNode | React.ReactNode[]
}

const StyledDataTableCol = styled.div`
  padding: 16px;
`

export const DataTableCol: React.FC<DataTableColProps> = ({ children }) => (
  <StyledDataTableCol>{children}</StyledDataTableCol>
)
