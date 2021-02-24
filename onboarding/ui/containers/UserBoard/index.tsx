import { AgreementMap } from '@centrifuge/onboarding-api/src/controllers/user.controller'
import { Agreement } from '@centrifuge/onboarding-api/src/repos/agreement.repo'
import { UserWithKyc } from '@centrifuge/onboarding-api/src/repos/user.repo'
import { Box } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import UserModal from '../../components/UserModal'

interface Props {
  onboardingApiHost: string
  users: AgreementMap
}

const UserBoard: React.FC<Props> = (props: Props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)
  const [activeUser, setActiveUser] = React.useState(undefined as UserWithKyc | undefined)
  const [activeAgreements, setActiveAgreements] = React.useState([] as Agreement[])

  const openModal = (user: UserWithKyc, agreements: Agreement[]) => {
    setActiveUser(user)
    setActiveAgreements(agreements)
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  const sortInvestors = (col: string, investors: { agreements: Agreement[]; user: UserWithKyc }[]) => {
    return investors.sort((a, b) => {
      if (col === 'Whitelisted')
        return new Date(b.agreements[0].counterSignedAt).getTime() - new Date(a.agreements[0].counterSignedAt).getTime()
      if (col === 'Awaiting counter-signature')
        return new Date(b.agreements[0].signedAt).getTime() - new Date(a.agreements[0].signedAt).getTime()
      if (a.user.createdAt && b.user.createdAt)
        new Date(b.user.createdAt).getTime() - new Date(a.user.createdAt).getTime()
      return 0
    })
  }

  return (
    <Content>
      <Columns>
        {Object.keys(props.users).map((col: string) => (
          <Column key={col}>
            <ColumnTitle>
              <div>{col}</div> <ColMetric>{props.users[col].length}</ColMetric>
            </ColumnTitle>
            <Cards>
              {sortInvestors(col, props.users[col]).map(({ user, agreements }) => (
                <Card
                  key={user.id}
                  pad="medium"
                  elevation="small"
                  round="xsmall"
                  margin={{ bottom: 'medium' }}
                  background="white"
                  onClick={() => openModal(user, agreements)}
                >
                  <InvestorName>{user.entityName || user.fullName}</InvestorName>
                  <Flag>
                    <img src={`https://www.countryflags.io/${user.countryCode}/flat/24.png`} />
                  </Flag>

                  <TimeAgo>
                    {col === 'Awaiting counter-signature' && timeAgo(agreements[0].signedAt)}
                    {col === 'Whitelisted' && timeAgo(agreements[0].counterSignedAt)}
                    {user.createdAt && col === 'Interested' && timeAgo(user.createdAt)}
                  </TimeAgo>
                </Card>
              ))}
            </Cards>
          </Column>
        ))}
      </Columns>

      {activeUser && (
        <UserModal isOpen={modalIsOpen} close={closeModal} user={activeUser} agreements={activeAgreements} />
      )}
    </Content>
  )
}

const Content = styled.div`
  padding: 40px;
  text-align: center;
  max-width: 100%;
  overflow-x: scroll;
  height: calc(100% - 60px);
`

const Columns = styled.div`
  display: inline-flex;
  margin: 0 auto;
`

const Column = styled.div`
  width: 260px;
  margin: 0 20px 0 0;
`

const ColumnTitle = styled.div`
  color: #777777;
  margin: 0 0 20px 20px;
  font-weight: bold;
  font-size: 14px;
  text-align: left;
  display: flex;
`

const ColMetric = styled.div`
  margin-left: auto;
  background: #2762ff;
  color: #fff;
  border-radius: 100%;
  padding: 3px 0;
  width: 24px;
  height: 24px;
  font-size: 12px;
  text-align: center;
`

const Cards = styled.div``

const Card = styled(Box)`
  display: flex;
  flex-direction: row;
  text-align: left;
  transition: all 100ms linear 0s;
  cursor: pointer;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 2px 6px;
    transform: scale(1.01);
  }
`

const InvestorName = styled.div``

const Flag = styled.div`
  margin-left: 10px;

  img {
    width: 18px;
    height: 18px;
    position: relative;
    top: 2px;
  }
`

const TimeAgo = styled.div`
  margin-left: auto;
  font-size: 12px;
  color: #666;
`

export default UserBoard

const timeAgo = (date: Date) => {
  var seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)

  var interval = seconds / 31536000

  if (interval > 1) {
    return Math.floor(interval) + ' years'
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + ' months'
  }
  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + 'd'
  }
  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + 'hr'
  }
  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + 'min'
  }
  return Math.floor(seconds) + 'sec'
}
