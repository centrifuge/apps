import { GetStaticProps } from 'next'
import Head from 'next/head'
import * as React from 'react'
import Auth from '../../../components/Auth'
import Header from '../../../components/Header'
import { IpfsPoolsProvider } from '../../../components/IpfsPoolsProvider'
import { RwaDetail } from '../../../components/RwaDetail'
import { TinlakeProvider } from '../../../components/TinlakeProvider'
import WithFooter from '../../../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS } from '../../../config'

interface Props {
  ipfsPools: IpfsPools
}

const Home: React.FC<Props> = (props: Props) => {
  return (
    <IpfsPoolsProvider value={props.ipfsPools}>
      <TinlakeProvider
        addresses={{
          RWA_MARKET_LENDING_POOL: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          RWA_MARKET_AUSDC: '0x9bc94a6a0d99fe559fa4dc5354ce3b96b210c210',
        }}
      >
        <WithFooter>
          <Head>
            <title>Real-World Asset Market | Tinlake | Centrifuge</title>
          </Head>
          <Auth>
            <Header poolTitle="Real-World Asset Market" selectedRoute={''} menuItems={[]} ipfsPools={props.ipfsPools} />
            <RwaDetail />
          </Auth>
        </WithFooter>
      </TinlakeProvider>
    </IpfsPoolsProvider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ipfsPools = await loadPoolsFromIPFS()
  // Fix to force page rerender, from https://github.com/vercel/next.js/issues/9992
  const newProps: Props = { ipfsPools }
  return { props: newProps }
}

export default Home
