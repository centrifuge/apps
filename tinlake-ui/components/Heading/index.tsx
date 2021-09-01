import { Heading } from 'grommet'

export const SectionHeading: React.FC = ({ children }) => {
  return (
    <Heading margin="none" level={2} size="16px">
      {children}
    </Heading>
  )
}
