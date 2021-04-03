import * as React from 'react'
import { Box, Image } from 'grommet'
import Link from 'next/link'
import { PoolSelector } from '../PoolSelector'
import { NavBar } from '@centrifuge/axis-nav-bar'
import { useRouter } from 'next/router'

interface Props {
  onboardingApiHost: string
}

interface MenuItem {
  label: string
  route: string
  inPool: boolean
  secondary?: boolean
  env: string
}

const menuItems: MenuItem[] = [
  { label: 'Leads', route: '/', inPool: true, env: '' },
  { label: 'Investors', route: '/investors', inPool: true, env: '' },
]

const Header: React.FC<Props> = (props: Props) => {
  const [pools, setPools] = React.useState([])

  React.useEffect(() => {
    async function getPools() {
      const res = await fetch(`${props.onboardingApiHost}pools`)
      const body = await res.json()
      setPools(body)
    }

    getPools()
  }, [])

  const router = useRouter()

  const onRouteClick = (item: MenuItem) => {
    router.push(item.route)
  }

  return (
    <Box
      style={{ position: 'sticky', top: 0, height: '56px', zIndex: 2, boxShadow: '0 0 4px 0px #00000075' }}
      background="white"
      justify="center"
      align="center"
      direction="row"
      fill="horizontal"
      pad={{ horizontal: 'small' }}
    >
      <Box direction="row" width="xlarge" align="center">
        <Box align="center" direction="row" basis="full">
          <div
            style={{
              height: 32,
              paddingRight: 16,
              borderRight: '1px solid #D8D8D8',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Link href="/" shallow>
              <a title="Tinlake" style={{ display: 'block' }}>
                <Image
                  src={'https://tinlake.centrifuge.io/static/logo.svg'}
                  style={{ width: 130, verticalAlign: 'middle' }}
                />
              </a>
            </Link>
          </div>
          <PoolSelector title={'Fortunafi Series 1'} pools={pools} />
          <Box flex="grow" basis="auto" style={{ height: 32, padding: '0 16px 0 32px' }}>
            <NavBar
              border={false}
              itemGap="large"
              menuItems={menuItems}
              selectedRoute={router.route}
              onRouteClick={onRouteClick}
              pad={{ horizontal: 'none' }}
              menuItemProps={{ style: { fontSize: 14 } }}
              hamburgerBreakpoint={1000}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Header
