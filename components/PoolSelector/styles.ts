import styled from 'styled-components'
import { FormField } from 'grommet'

export const Title = styled.div`
  display: flex;
  flex-direction: row;
`

export const TitleText = styled.div`
  flex-grow: 1;
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
  max-height: 200px;
  overflow-y: scroll;
`

export const PoolList = styled.div`
  margin-bottom: 8px;
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
