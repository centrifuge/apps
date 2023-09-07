import { Box } from '@centrifuge/fabric'
import { Link } from 'react-router-dom'
import { config } from '../config'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'

const [LogoMark, WordMark] = config.logo

export function LogoLink() {
  const isMedium = useIsAboveBreakpoint('M')
  const isLarge = useIsAboveBreakpoint('L')

  return (
    <Box as={Link} to="/" display="block" width={[80, 80, 36, 108]}>
      {isMedium && !isLarge ? <LogoMark /> : <WordMark />}
    </Box>
  )
}
