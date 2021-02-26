import { Pool } from '@centrifuge/onboarding-api/src/services/pool.service'
import { Drop, TextInput } from 'grommet'
import { FormDown, FormSearch } from 'grommet-icons'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadInvestors, UsersState } from '../../ducks/users'
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

interface Props {
  pools: Pool[] // TODO: add type
  title: string
}

// TODO: this should be an axis component
export const PoolSelector: React.FC<Props> = (props: Props) => {
  const dispatch = useDispatch()
  const activePool = useSelector((state: { users: UsersState }) => state.users.activePool)

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

  const onChangeSearchQuery = (event: React.FormEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value)
  }

  const filterPools = () => {
    const livePools = props.pools
    if (!livePools) {
      return []
    }
    if (searchQuery.trim().length === 0) {
      return livePools
    }
    return livePools.filter((pool: Pool) => pool.metadata.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  }

  const navigateToPool = (pool: Pool) => {
    dispatch(loadInvestors('http://localhost:3100/', pool))
    setOpen(false)
  }

  React.useEffect(() => {
    if (props.pools.length > 0) {
      dispatch(loadInvestors('http://localhost:3100/', props.pools[0]))
    }
  }, [props.pools])

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
          <Title>{activePool?.metadata.name}</Title>
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
              {props.pools.length >= 6 && (
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
              {filterPools().map((pool: any) => (
                <PoolLink key={pool.id} active={pool.name === props.title} onClick={() => navigateToPool(pool)}>
                  <Icon
                    src={
                      pool.metadata.media.icon ||
                      'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'
                    }
                  />
                  {pool.metadata.name}
                </PoolLink>
              ))}
            </PoolList>
          </Wrapper>
        </Drop>
      )}
    </DesktopOnlyBox>
  )
}
