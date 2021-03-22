import { Box, Button, Heading } from 'grommet'
import * as React from 'react'
import queries from './queries'
import Apollo from '../../services/apollo'
import { downloadCSV } from '../../utils/export'

interface Props {}

const Query: React.FC<Props> = () => {
  const download = async (name: keyof typeof queries) => {
    const query = queries[name]
    const data = await Apollo.runCustomQuery(query)

    Object.keys(data).map((root: string) => {
      const elements = data[root]
      const header = Object.keys(elements[0])
      // TODO: this doesnt support nested objects (e.g. pools { loans { id }})
      const rows = [header, ...elements.map((e: any) => Object.values(e))]

      downloadCSV(rows, `${name.replace(' ', '-').toLowerCase()}_${Math.round(Date.now() / 1000)}.csv`)
    })
  }

  return (
    <Box width="100%" pad="medium" elevation="small" round="xsmall" background="white" margin={{ top: 'large' }}>
      <Heading level="4" margin={{ top: '0' }}>
        Query Tinlake data
      </Heading>

      <div>
        {Object.keys(queries).map((name: string) => (
          <Button key={name} label={name} size="small" onClick={() => download(name as keyof typeof queries)} />
        ))}
      </div>
    </Box>
  )
}

export default Query
