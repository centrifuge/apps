import styled from 'styled-components'

export const Container = styled.div`
  padding-bottom: 12px;
`

export const Row = styled.div`
  cursor: pointer;
  display: flex;
  width: fit-content;
`

export const Primer = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  color: #0828be;
`

export const Btn = styled.div`
  margin-left: auto;
  display: flex;
  flex-direction: row;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  color: #333;
  text-decoration: underline;
`

export const Caret = styled.div`
  height: 24px;
  margin-left: 10px;
  svg {
    transition: 200ms;
    transform-style: preserve-3d;
  }
`

export const Text = styled.div`
  margin-top: 16px;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #333;
`
