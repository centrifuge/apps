import { Box } from '@centrifuge/fabric'
import { Link } from 'react-router-dom'
import { config } from '../config'

const [WordMark] = config.logo

export function LogoLink() {
  return (
    <Box as={Link} to="/" display="block" width={[108]}>
      <WordMark />
    </Box>
  )
}
