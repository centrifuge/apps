import { Box, Button, Heading } from 'grommet'
import * as React from 'react'
import queries from './queries'

interface Props {}

const Query: React.FC<Props> = () => {
  const download = async (name: keyof typeof queries) => queries[name]()

  return (
    <Box width="100%" pad="medium" elevation="small" round="xsmall" background="white" margin={{ top: 'large' }}>
      <Heading level="4" margin={{ top: '0' }}>
        Query Tinlake data
      </Heading>

      <div>
        {Object.keys(queries)
          .sort()
          .map((name: string) => (
            <div key={name}>
              <Button
                key={name}
                label={name}
                size="small"
                onClick={() => download(name as keyof typeof queries)}
                margin={{ top: 'small' }}
              />
            </div>
          ))}
      </div>
    </Box>
  )
}

export default Query
