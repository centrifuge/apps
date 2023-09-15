import { Request, Response } from 'express'
import { fetchTaxInfo } from '../../utils/fetchTaxInfo'
import { reportHttpError } from '../../utils/httpError'

export const getTaxInfoController = async (req: Request, res: Response) => {
  try {
    const taxInfo = await fetchTaxInfo(req.wallet)
    return res.send({ taxInfo })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
