import { copyToClipboard } from '@centrifuge/axis-utils'
import { Button, Drop } from 'grommet'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { WalletTransaction } from '../../ducks/transactions'
import { useENS } from '../../utils/useENS'
import { AnimatedBar } from './AnimatedBar'
import { ToastWrapper } from './Toast'
const { toDataUrl } = require('ethereum-blockies')

interface Props {
  address: string
  providerName: string
  networkName: string
  onDisconnect: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  transactions: WalletTransaction[]
  getAddressLink: (address: string) => string
}

export const Web3Wallet: React.FunctionComponent<Props> = ({
  address,
  providerName,
  networkName,
  onDisconnect,
  transactions,
  getAddressLink,
  ...rest
}) => {
  const [open, setOpen] = useState(false)
  const [justClosed, setJustClosed] = useState(false)
  const [copied, setCopied] = useState(false)
  const contRef = useRef<HTMLButtonElement>(null)
  const [, setShowDrop] = useState(false)
  const { ensName, ensAvatar } = useENS(address)
  useEffect(() => setShowDrop(true), [])

  return (
    <>
      <Container
        {...rest}
        ref={contRef}
        plain
        onClick={() => {
          if (!justClosed) {
            setOpen(true)
          }
        }}
      >
        <InnerWallet>
          <IdenticonSmall>
            {ensAvatar ? (
              <Image src={ensAvatar} width={24} height={24} loader={({ src }) => src} />
            ) : (
              <Image src={toDataUrl(address)} width={24} height={24} loader={({ src }) => src} />
            )}
          </IdenticonSmall>
          <StatusAddrSmall>
            <Addr>{ensName || shorten(address, 4)}</Addr>
          </StatusAddrSmall>
          <Caret>
            <Image
              src="/static/chevron-down.svg"
              style={{ transform: open ? 'rotate(-180deg)' : '' }}
              width={16}
              height={16}
              loader={({ src }) => src}
            />
          </Caret>
        </InnerWallet>

        <AnimatedBar active={transactions.filter((tx) => tx.status === 'pending').length > 0} />
      </Container>
      {contRef.current && (
        <Drop
          plain
          responsive
          onClickOutside={() => {
            if (open) {
              setJustClosed(true)
              setOpen(false)
              setTimeout(() => setJustClosed(false), 0)
            }
          }}
          onEsc={() => setOpen(false)}
          style={{ padding: 6, marginTop: 20 }}
          target={contRef.current}
          align={{ right: 'right', top: 'bottom' }}
        >
          {open && (
            <Card>
              <Identicon>
                {ensAvatar ? (
                  <Image src={ensAvatar} width={64} height={64} loader={({ src }) => src} />
                ) : (
                  <Image src={toDataUrl(address)} width={64} height={64} loader={({ src }) => src} />
                )}
              </Identicon>
              <StatusAddrCopyLink>
                <StatusAddr>
                  <Subtitle>
                    Connected to {providerName} - {networkName}
                  </Subtitle>
                  <Addr title={address}>{ensName || shorten(address, 8)}</Addr>
                </StatusAddr>
                <Copy
                  plain
                  onClick={() =>
                    copyToClipboard(address)
                      .then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      })
                      .catch(() => console.log('copy api not supported'))
                  }
                >
                  {copied ? (
                    <Image src="/static/wallet/check.svg" width={24} height={24} loader={({ src }) => src} />
                  ) : (
                    <Image src="/static/wallet/copy.svg" width={24} height={24} loader={({ src }) => src} />
                  )}
                </Copy>
                <Link plain href={getAddressLink(address)} target="_blank">
                  <Image src="/static/wallet/external-link.svg" width={24} height={24} loader={({ src }) => src} />
                </Link>
              </StatusAddrCopyLink>

              <Button label="Disconnect" margin={{ top: '14px' }} onClick={onDisconnect} />
            </Card>
          )}
          {transactions
            .filter((tx) => (open ? true : tx.showIfClosed))
            .map((tx: WalletTransaction, index: number) => (
              <ToastWrapper key={index} {...tx} />
            ))}
        </Drop>
      )}
    </>
  )
}

export default Web3Wallet

const shorten = (addr: string, visibleChars: number) =>
  `${addr.substr(0, visibleChars)}...${addr.substr(addr.length - visibleChars)}`

const InnerWallet = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const Container = styled(Button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`

const IdenticonSmall = styled.div`
  height: 24px;
  width: 24px;
  text-align: left;
`

const StatusAddrSmall = styled.div`
  margin-left: 6px;
  @media (max-width: 1199px) {
    display: none;
  }
`

const Subtitle = styled.div`
  height: 14px;
  font-size: 10px;
  line-height: 14px;
  color: #999;
`

const Addr = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #000000;
  margin-right: 8px;
`

const Caret = styled.div`
  height: 16px;
  img {
    transition: transform 200ms;
  }
  @media (max-width: 899px) {
    display: none;
  }
`

const Card = styled.div`
  width: 356px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
`

const Identicon = styled.div`
  height: 64px;
  margin-bottom: 16px;
`

const StatusAddr = styled.div``

const StatusAddrCopyLink = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`

const Copy = styled(Button)`
  margin-top: 1px;
  margin-left: auto;
  height: 24px;
`

const Link = styled(Button)`
  margin-top: 1px;
  margin-left: 8px;
  height: 24px;
`
