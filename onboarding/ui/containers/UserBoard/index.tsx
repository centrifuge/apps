import { UserWithRelations } from '@centrifuge/onboarding-api/src/controllers/user.controller'
import { Box } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import UserModal from '../../components/UserModal'
import { useHotkeys } from 'react-hotkeys-hook'

interface Props {
  onboardingApiHost: string
  etherscanUrl: string
  users: UserWithRelations[]
}

const UserBoard: React.FC<Props> = (props: Props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)
  const [activeUser, setActiveUser] = React.useState(undefined as UserWithRelations | undefined)

  const [focusedCol, setFocusedCol] = React.useState(0)
  const [focusedIndex, setFocusedIndex] = React.useState(0)

  const openModal = (user: UserWithRelations, colIndex: number, index: number) => {
    setFocusedCol(colIndex)
    setFocusedIndex(index)

    setActiveUser(user)
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  const sortInvestors = (col: string, investors: UserWithRelations[]) => {
    return investors.sort((a, b) => {
      if (col === 'Signed, awaiting KYC')
        return new Date(b.agreements[0].counterSignedAt).getTime() - new Date(a.agreements[0].counterSignedAt).getTime()
      if (col === 'Awaiting counter-signature')
        return new Date(b.agreements[0].signedAt).getTime() - new Date(a.agreements[0].signedAt).getTime()
      if (a.user.createdAt && b.user.createdAt)
        return new Date(b.user.createdAt).getTime() - new Date(a.user.createdAt).getTime()
      return 0
    })
  }

  useHotkeys(
    'enter',
    () => {
      if (!modalIsOpen) {
        openModal(Object.values(props.users)[focusedCol][focusedIndex], focusedCol, focusedIndex)
      }
    },
    [props.users, modalIsOpen, focusedIndex, focusedCol]
  )

  useHotkeys(
    'up',
    () => {
      if (!modalIsOpen && focusedIndex > 0) {
        setFocusedIndex(focusedIndex - 1)
      }
    },
    [props.users, modalIsOpen, focusedIndex, focusedCol]
  )

  useHotkeys(
    'down',
    () => {
      if (!modalIsOpen && focusedIndex < Object.values(props.users)[focusedCol].length - 1) {
        setFocusedIndex(focusedIndex + 1)
      }
    },
    [props.users, modalIsOpen, focusedIndex, focusedCol]
  )

  useHotkeys(
    'left',
    () => {
      if (!modalIsOpen && focusedCol > 0) {
        setFocusedCol(focusedCol - 1)
      }
    },
    [props.users, modalIsOpen, focusedCol, focusedCol]
  )

  useHotkeys(
    'right',
    () => {
      if (!modalIsOpen && focusedCol < Object.keys(props.users).length - 1) {
        const newCol = focusedCol + 1
        setFocusedCol(newCol)

        if (focusedIndex > Object.values(props.users)[newCol].length - 1) {
          setFocusedIndex(Object.values(props.users)[newCol].length - 1)
        }
      }
    },
    [props.users, modalIsOpen, focusedCol, focusedCol]
  )

  return (
    <Content>
      <Columns>
        {Object.keys(props.users).map((col: string, colIndex: number) => (
          <Column key={col}>
            <ColumnTitle>
              <div>{col}</div> <ColMetric>{props.users[col].length}</ColMetric>
            </ColumnTitle>
            <Cards>
              {sortInvestors(col, props.users[col]).map((user: UserWithRelations, index: number) => (
                <Card
                  key={user.user.id}
                  pad="small"
                  elevation="small"
                  round="xsmall"
                  margin={{ bottom: 'medium' }}
                  background="white"
                  onClick={() => openModal(user, colIndex, index)}
                  focusIndicator={false}
                  focused={focusedCol === colIndex && focusedIndex === index}
                >
                  <Flag>
                    <img src={`/flags/${user.user.countryCode}.svg`} />
                  </Flag>
                  <InvestorName>{user.user.entityName || user.user.fullName}</InvestorName>

                  <TimeAgo>
                    {col === 'Awaiting counter-signature' && timeAgo(user.agreements[0].signedAt)}
                    {col === 'Signed, awaiting KYC' && timeAgo(user.agreements[0].counterSignedAt)}
                    {user.user.createdAt && col === 'Interested' && timeAgo(user.user.createdAt)}
                  </TimeAgo>
                </Card>
              ))}
            </Cards>
          </Column>
        ))}
      </Columns>

      {activeUser && (
        <UserModal isOpen={modalIsOpen} close={closeModal} user={activeUser} etherscanUrl={props.etherscanUrl} />
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

const Card = styled(Box)<{ focused?: boolean }>`
  display: flex;
  flex-direction: row;
  text-align: left;
  transition: all 100ms linear 0s;
  cursor: pointer;
  margin-bottom: 10px;
  box-shadow: ${(props) => (props.focused ? '0 0 2px 2px #2762ff' : '0')};

  &:focus {
    box-shadow: ${(props) => (props.focused ? '0 0 2px 2px #2762ff' : '0')};
  }

  &:hover {
    transform: scale(1.01);
  }
`

const InvestorName = styled.div``

const Flag = styled.div`
  margin-right: 10px;
  margin-left: 4px;
  width: 20px;

  img {
    height: 10px;
  }
`

const TimeAgo = styled.div`
  margin-left: auto;
  font-size: 12px;
  color: #666;
  margin-right: 2px;
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
