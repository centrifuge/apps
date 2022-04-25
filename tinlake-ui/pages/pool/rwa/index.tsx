import centrifugeLight from '@centrifuge/fabric/dist/theme/centrifugeLight'
import { GetStaticProps } from 'next'
import Head from 'next/head'
import * as React from 'react'
import { DefaultTheme, ThemeProvider } from 'styled-components'
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

const lightTheme: DefaultTheme = { ...centrifugeLight }

const Home: React.FC<Props> = (props: Props) => {
  return (
    <IpfsPoolsProvider value={props.ipfsPools}>
      <TinlakeProvider>
        <ThemeProvider theme={lightTheme}>
          <WithFooter>
            <Head>
              <title>Real-World Asset Market | Tinlake | Centrifuge</title>
            </Head>
            <Auth>
              <Header
                poolTitle="Real-World Asset Market"
                selectedRoute={''}
                menuItems={[]}
                ipfsPools={props.ipfsPools}
              />
              <RwaDetail />
            </Auth>
          </WithFooter>
        </ThemeProvider>
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
