import * as React from 'react'
import { Box, Drop, TextInput } from 'grommet'
import { useSelector, useDispatch } from 'react-redux'
import { loadPools, PoolData } from '../../ducks/pools'
import { useRouter } from 'next/router'
import { FormDown, FormSearch } from 'grommet-icons'

import { Wrapper, Title, TitleText, PoolList, SearchField, PoolLink, Caret } from './styles'

interface Props {
  title: string
}

export const PoolSelector: React.FC<Props> = (props: Props) => {
  const router = useRouter()

  const pools = useSelector((state) => state.pools)
  const dispatch = useDispatch()

  const poolRef = React.useRef<HTMLDivElement>(null)

  const [open, setOpen] = React.useState<boolean>(false)
  const [justClosed, setJustClosed] = React.useState<boolean>(false)

  const [searchQuery, setSearchQuery] = React.useState<string>('')

  const onClickOutside = () => {
    if (open) {
      setJustClosed(true)
      setOpen(false)
      setTimeout(() => setJustClosed(false), 0)
    }
  }

  React.useEffect(() => {
    dispatch(loadPools())
  }, [router.query])

  const onChangeSearchQuery = (event: React.FormEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value)
  }

  const filterPools = (pools: PoolData[] | undefined) => {
    if (!pools) {
      return []
    }
    if (searchQuery.trim().length === 0) {
      return pools
    }
    return pools.filter((pool: PoolData) => pool.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  }

  const navigateToPool = (pool: PoolData) => {
    router.push('/[root]', `/${pool.id}`)
    setOpen(false)
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
        onClick={(e) => {
          if (!justClosed) {
            setOpen(true)
          }
        }}
        focusIndicator={false}
      >
        <Title>
          <TitleText>
            <div style={{ height: 12, lineHeight: '12px', fontWeight: 500, fontSize: 10, color: '#bbb' }}>
              Investment Pool
            </div>
            <div style={{ height: 16, lineHeight: '16px', fontWeight: 500, fontSize: 14, marginTop: 4 }}>
              {props.title}
            </div>
          </TitleText>
          <Caret>
            <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
          </Caret>
        </Title>
      </Box>

      {open && poolRef.current && (
        <Drop
          plain
          responsive
          target={poolRef.current}
          align={{ right: 'right', top: 'bottom' }}
          style={{ padding: 6, marginTop: 10 }}
          onClickOutside={onClickOutside}
          onEsc={() => setOpen(false)}
        >
          <Wrapper>
            <PoolList>
              {pools.data?.pools.length >= 5 && (
                <SearchField>
                  <TextInput
                    placeholder="Search"
                    value={searchQuery}
                    onChange={onChangeSearchQuery}
                    icon={<FormSearch />}
                    reverse
                    autoFocus
                  />
                </SearchField>
              )}
              {filterPools(pools.data?.pools).map((pool: PoolData) => (
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
