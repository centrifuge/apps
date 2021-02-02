import styled from 'styled-components';
import { DataTable } from 'grommet';

export const DataTableWithDynamicHeight = styled(DataTable).attrs(props => ({
  size: props.size || 'calc(100vh - 280px)',
}))`
  tbody {
    max-height: ${props => props.size};
    overflow: overlay;
  }
`;
