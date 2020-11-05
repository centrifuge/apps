import * as React from 'react'
import { Drop, TextInput } from 'grommet'
import { useSelector, useDispatch } from 'react-redux'
import { loadPools, PoolData, PoolsState } from '../../ducks/pools'
import { useRouter } from 'next/router'
import { FormDown, FormSearch } from 'grommet-icons'

import { Button, Wrapper, Title, PoolTitle, Desc, PoolList, SearchField, PoolLink, Caret } from './styles'

interface Props {
  title: string
}

export const PoolSelector: React.FC<Props> = (props: Props) => {
  const router = useRouter()

  const pools = useSelector<any, PoolsState>((state: any) => state.pools)
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
    if (pool.isUpcoming) {
      router.push('/pool/[slug]', `/pool/${pool.slug}`)
    } else {
      router.push('/pool/[root]/[slug]', `/pool/${pool.id}/${pool.slug}`)
    }
    setOpen(false)
  }

  return (
    <>
      <Button
        ref={poolRef}
        onClick={() => {
          if (!justClosed) {
            setOpen(true)
          }
        }}
      >
        <PoolTitle>
          <Desc>Investment Pool</Desc>
          <Title>{props.title}</Title>
        </PoolTitle>
        <Caret>
          <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
        </Caret>
      </Button>

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
              {pools.data?.pools && pools.data?.pools.length >= 5 && (
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
