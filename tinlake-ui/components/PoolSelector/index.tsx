import { Drop, TextInput } from 'grommet'
import { FormDown, FormSearch } from 'grommet-icons'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadPools, PoolData, PoolsState } from '../../ducks/pools'
import {
  Button,
  Caret,
  Desc,
  DesktopOnlyBox,
  Icon,
  PoolLink,
  PoolList,
  PoolTitle,
  SearchField,
  Title,
  Wrapper,
} from './styles'
import { IpfsPools } from '../../config'

interface Props {
  ipfsPools: IpfsPools
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
    dispatch(loadPools(props.ipfsPools))
  }, [router.query])

  const onChangeSearchQuery = (event: React.FormEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value)
  }

  const getLivePools = () => {
    return pools.data?.pools.filter((p) => !p.isArchived).sort((a, b) => b.order - a.order) || []
  }

  const filterPools = () => {
    const livePools = getLivePools()
    if (!livePools) {
      return []
    }
    if (searchQuery.trim().length === 0) {
      return livePools
    }
    return livePools.filter((pool: PoolData) => pool.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  }

  const navigateToPool = (pool: PoolData) => {
    if (pool.isUpcoming) {
      router.push('/pool/[slug]', `/pool/${pool.slug}`)
    } else if (pool.isArchived) {
      router.push('/pool/[slug]', `/pool/${pool.slug}`)
    } else {
      router.push('/pool/[root]/[slug]', `/pool/${pool.id}/${pool.slug}`)
    }
    setOpen(false)
  }

  return (
    <DesktopOnlyBox>
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
              {getLivePools().length >= 6 && (
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
              {filterPools().map((pool: PoolData) => (
                <PoolLink key={pool.id} active={pool.name === props.title} onClick={() => navigateToPool(pool)}>
                  <Icon src={pool.icon || 'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'} />
                  {pool.name}
                </PoolLink>
              ))}
            </PoolList>
          </Wrapper>
        </Drop>
      )}
    </DesktopOnlyBox>
  )
}
