import { Box } from '@centrifuge/fabric'
import { Link } from 'react-router-dom'
import { config } from '../config'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'

const [LogoMark, WordMark] = config.logo

export function LogoLink() {
  const isMedium = useIsAboveBreakpoint('M')
  const isXLarge = useIsAboveBreakpoint('XL')

  return (
    <Link to="/">
      <Box color="textPrimary" width={[80, 80, 36, 36, 120]}>
        {isMedium && !isXLarge ? <LogoMark /> : <WordMark />}
      </Box>
    </Link>
  )
}
