import { Box } from '@centrifuge/fabric'
import { Link } from 'react-router-dom'
import { config } from '../config'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'

const [LogoMark, WordMark] = config.logo

export function LogoLink() {
  const isMedium = useIsAboveBreakpoint('M')
  const isLarge = useIsAboveBreakpoint('L')

  return (
    <Link to="/">
      <Box color="textPrimary" width={[80, 80, 36, 120, 120]}>
        {!isMedium || isLarge ? <WordMark /> : <LogoMark />}
      </Box>
    </Link>
  )
}
