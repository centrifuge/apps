import { InlineFeedback } from '@centrifuge/fabric'

export function EpochBusy({ busy }: { busy?: boolean }) {
  return busy ? (
    <InlineFeedback>
      The pool is busy calculating epoch orders.
      <br />
      Try again later.
    </InlineFeedback>
  ) : null
}
