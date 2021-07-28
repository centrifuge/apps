import { Box, FormField } from 'grommet'
import styled from 'styled-components'

export const Button = styled(Box)`
  padding: 0 16px 0 0;
  display: flex;
  flex-direction: row;
  align-items: center;
`

export const Icon = styled.img`
  width: 20px;
  height: 20px;
  margin-right: 12px;
  position: relative;
  top: 5px;
`

export const Title = styled.div`
  height: 16px;
  line-height: 16px;
  font-weight: 500;
  font-size: 14px;
`

export const Caret = styled.img`
  margin-left: 6px;
  width: 16px;
  height: 16px;
  transition: transform 200ms;
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
  padding: 10px 14px 14px 14px;
  width: 100%;
  color: ${(props) => (props.active ? '#2762FF' : '#000')};
  cursor: pointer;

  &:hover,
  &:focus {
    background: #efefef;
  }
`
