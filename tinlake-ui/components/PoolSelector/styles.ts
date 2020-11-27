import { Box, FormField } from 'grommet'
import styled from 'styled-components'

export const Button = styled(Box)`
  flex: 0 0 239px;
  height: 32;
  padding: 0 16px;
  border-right: 1px solid #d8d8d8;
  display: flex;
  flex-direction: row;
`

export const PoolTitle = styled.div`
  flex-grow: 1;
`

export const Desc = styled.div`
  height: 12px;
  line-height: 12px;
  font-weight: 500;
  font-size: 10px;
  color: #bbb;
`

export const Title = styled.div`
  height: 16px;
  line-height: 16px;
  font-weight: 500;
  font-size: 14px;
  margin-top: 4px;
`

export const Caret = styled.div`
  height: 24px;
  margin-left: 20px;
  margin-top: 4px;

  svg {
    transition: 200ms;
    transform-style: preserve-3d;
  }
`

export const Wrapper = styled.div`
  background: #fff;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  max-height: 300px;
  overflow-y: scroll;
`

export const PoolList = styled.div`
  margin-bottom: 8px;
  padding-top: 8px;
`

export const SearchField = styled(FormField)`
  margin: 0 12px 12px 12px;
`

interface PoolLinkProps {
  active?: boolean
}

export const PoolLink = styled.div<PoolLinkProps>`
  padding: 12px 14px;
  width: 100%;
  color: ${(props) => (props.active ? '#2762FF' : '#000')};
  cursor: pointer;

  &:hover,
  &:focus {
    background: #efefef;
  }
`
