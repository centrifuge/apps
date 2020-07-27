import * as React from 'react'
import styled from 'styled-components'
import { Box, Drop } from 'grommet'
import { useSelector, useDispatch } from 'react-redux'
import { loadPools, PoolData } from '../../ducks/pools'
import Router from 'next/router'

const Wrapper = styled.div`
  background: #fff;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: scroll;
`

const PoolList = styled.div``

interface PoolLinkProps {
  active?: boolean
}

const PoolLink = styled.div<PoolLinkProps>`
  padding: 12px 10px;
  width: 100%;
  color: ${(props) => (props.active ? '#2762FF' : '#000')};
  cursor: pointer;

  &:hover,
  &:focus {
    background: #efefef;
  }
`

interface Props {
  title: string
}

export const PoolSelector: React.FC<Props> = (props: Props) => {
  const pools = useSelector((state) => state.pools)
  const dispatch = useDispatch()

  const poolRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState<boolean>(false)

  const toggle = () => setOpen(!open)

  React.useEffect(() => {
    dispatch(loadPools())
  }, [])

  const navigateToPool = (pool: PoolData) => {
    Router.push('/[root]', `/${pool.id}`)
    toggle()
  }

  return (
    <>
      <Box
        style={{
          flex: '0 0 239px',
          height: 32,
          padding: '0 16px',
          borderRight: '1px solid #D8D8D8',
          display: 'flex',
        }}
        ref={poolRef}
        onClick={toggle}
        focusIndicator={false}
      >
        <div style={{ height: 12, lineHeight: '12px', fontWeight: 500, fontSize: 10, color: '#bbb' }}>
          Investment Pool
        </div>
        <div style={{ height: 16, lineHeight: '16px', fontWeight: 500, fontSize: 14, marginTop: 4 }}>{props.title}</div>
      </Box>

      {open && poolRef.current && (
        <Drop
          plain
          responsive
          target={poolRef.current}
          align={{ right: 'right', top: 'bottom' }}
          style={{ padding: 6, marginTop: 10 }}
        >
          <Wrapper>
            <PoolList>
              {pools.data?.pools.map((pool: PoolData) => (
                <PoolLink key={pool.id} active={pool.name === props.title} onClick={() => navigateToPool(pool)}>
                  {pool.name}
                </PoolLink>
              ))}
            </PoolList>
          </Wrapper>
        </Drop>
      )}
    </>
  )
}
