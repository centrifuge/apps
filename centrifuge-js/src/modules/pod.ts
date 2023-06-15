import { u8aToHex } from '@polkadot/util'
import { decodeAddress } from '@polkadot/util-crypto'
import { PoolMetadata } from './pools'

type JobResponse = {
  JobID: string
  desc: string
  finished: boolean
  finished_at: string
  overrides: Record<string, any>
  runner: string
  tasks: {
    args: Record<string, any>[]
    delay: string
    error: string
    result: any
    runnerFuncs: string
    tries: number
  }[]
  valid_until: string
}

type CommitedDocumentResponse = {
  header: {
    document_id: string
    previous_version_id: string
    version_id: string
    next_version_id: string
    author: string
    created_at: string
    read_access: string[] | null
    write_access: string[] | null
    nfts:
      | {
          collection_id: number
          item_id: string
        }[]
      | null
    status: 'committed'
    fingerprint: string
  }
  scheme: string
  data: {}
  attributes: Record<
    string,
    {
      type: 'integer' | 'decimal' | 'string' | 'bytes' | 'timestamp' | 'monetary'
      value: string | number | boolean
      key: string
    }
  >
}

type CreateDocumentInput = {
  attributes: Record<
    string,
    {
      type: 'integer' | 'decimal' | 'string' | 'bytes' | 'timestamp' | 'monetary'
      value: string | number | boolean
      monetary_value?: string
    }
  >
  writeAccess?: string[]
  readAccess?: string[]
}

type CommitDocumentInput = {
  documentId: string
  collectionId: string
  owner: string
  publicAttributes?: string[]
  name: string
  description?: string
  image?: string
}

class JobFailedError extends Error {
  response: JobResponse
  constructor(jobResponse: JobResponse) {
    super('Job failed')
    this.response = jobResponse
  }
}

/**
 * Module to interact with the Centrifuge P2P Node for sharing private documents
 * @see https://github.com/centrifuge/go-centrifuge
 */
export function getPodModule() {
  async function callPod<T = any>(podUrl: string, path: string, method: string, token?: string, body?: object) {
    const url = new URL(path, podUrl)
    const res = await fetch(url.toString(), {
      method,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res
        return res.json().then((res) => {
          throw new Error(res.message)
        })
      })
      .then((res) => res.json())
    return res as T
  }

  async function callIndexer<T = any>(indexerUrl: string, query: string, variables?: any) {
    const res = await fetch(indexerUrl, {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (res) => {
      const { data, errors } = await res.json()
      if (errors?.length) {
        throw errors
      }
      return data as T
    })
    return res as T
  }

  async function getReports(
    args: [
      indexerUrl: string,
      poolMetadata: Required<Pick<PoolMetadata, 'aggregates' | 'reports'>>,
      page?: keyof Exclude<PoolMetadata['reports'], undefined>
    ]
  ) {
    const [indexerUrl, poolMetadata, page] = args
    const aggregateNames = Array.from(
      new Set(
        (page ? [poolMetadata.reports[page]] : Object.values(poolMetadata.reports)).flatMap((page) =>
          page.sections.map((s) => s.aggregate)
        )
      )
    )
    const res = await callIndexer(
      indexerUrl,
      `query {
          aggregations {
            ${aggregateNames.map(
              (n) => `${n}
            `
            )}
          }
        }`,
      {}
    )
    return res.aggregations
  }

  async function getJob(args: [podUrl: string, token: string, jobId: string]) {
    const [podUrl, token, jobId] = args
    const res = await callPod<JobResponse>(podUrl, `v2/jobs/${jobId}`, 'get', token)
    return res
  }

  const wait = (ms = 1000) => new Promise((res) => setTimeout(res, ms))
  async function awaitJob(args: [podUrl: string, token: string, jobId: string]) {
    let i = 100
    while (i--) {
      try {
        const job = await getJob(args)
        if (job.finished) {
          if (job.tasks[job.tasks.length - 1]?.error) throw new JobFailedError(job)
          return job
        }
      } catch (e) {
        //
      }
      await wait(6000)
    }

    throw new Error('Job timed out')
  }

  async function createAccount(args: [podUrl: string, token: string, address: `0x${string}`]) {
    const [podUrl, token, address] = args
    const res = await callPod(podUrl, 'v2/accounts/generate', 'post', token, {
      account: {
        identity: address,
        precommit_enabled: true,
        webhook_url: 'https://centrifuge.io',
      },
    })
    return {
      documentSigningKey: res.document_signing_public_key,
      p2pDiscoveryKey: res.p2p_public_signing_key,
      operatorAccountId: res.pod_operator_account_id,
    }
  }

  async function getAccount(args: [podUrl: string, token: string, address: `0x${string}`]) {
    const [podUrl, token, address] = args
    const res = await callPod(podUrl, `v2/accounts/${address}`, 'get', token)
    return {
      documentSigningKey: res.document_signing_public_key,
      p2pDiscoveryKey: res.p2p_public_signing_key,
      operatorAccountId: res.pod_operator_account_id,
    }
  }

  async function createDocument(args: [podUrl: string, token: string, document: CreateDocumentInput]) {
    const [podUrl, token, doc] = args
    const res = await callPod(podUrl, 'v2/documents', 'post', token, {
      attributes: doc.attributes,
      read_access: doc.readAccess?.map((addr) => u8aToHex(decodeAddress(addr))),
      write_access: doc.writeAccess?.map((addr) => u8aToHex(decodeAddress(addr))),
      scheme: 'generic',
    })
    return {
      documentId: res.header.document_id,
    }
  }

  async function commitDocumentAndMintNft(args: [podUrl: string, token: string, document: CommitDocumentInput]) {
    const [podUrl, token, doc] = args
    const res = await callPod(podUrl, `v3/nfts/collections/${doc.collectionId}/commit_and_mint`, 'post', token, {
      document_id: doc.documentId,
      owner: u8aToHex(decodeAddress(doc.owner)),
      freeze_metadata: false,
      ipfs_metadata: {
        description: doc.description,
        document_attribute_keys: doc.publicAttributes,
        image: doc.image,
        name: doc.name,
      },
    })

    const jobId = res.header.job_id

    return {
      jobId,
      nftId: res.item_id,
    }
  }

  async function getPendingDocument(args: [podUrl: string, token: string, documentId: string]) {
    const [podUrl, token, documentId] = args
    const res = await callPod<CommitedDocumentResponse>(podUrl, `v2/documents/${documentId}/pending`, 'get', token)
    return res
  }

  async function getCommittedDocument(args: [podUrl: string, token: string, documentId: string]) {
    const [podUrl, token, documentId] = args
    const res = await callPod<CommitedDocumentResponse>(podUrl, `v2/documents/${documentId}/committed`, 'get', token)
    return res
  }

  async function getSelf(args: [podUrl: string, token: string]) {
    const [podUrl, token] = args
    const res = await callPod<CommitedDocumentResponse>(podUrl, `v2/accounts/self`, 'get', token)
    return res
  }

  return {
    getJob,
    getAccount,
    createAccount,
    createDocument,
    commitDocumentAndMintNft,
    getPendingDocument,
    getCommittedDocument,
    awaitJob,
    getSelf,
    getReports,
  }
}
