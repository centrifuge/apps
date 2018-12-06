export class Invoice {
  constructor(
    readonly number: number,
    readonly supplier: string,
    readonly customer: string,
    readonly status?: string,
    readonly _id?: string,
  ) {}
}
