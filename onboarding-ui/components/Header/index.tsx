import { Box, Image } from 'grommet'
import Link from 'next/link'
import React from 'react'

interface Props {}

const Header: React.FC<Props> = () => {
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
        </Box>
      </Box>
    </Box>
  )
}

export default Header
