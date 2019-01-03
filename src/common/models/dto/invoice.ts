export class Invoice {
  constructor(
    readonly number: number,
    readonly supplier: string,
    readonly customer: string,
    readonly collaborators?: string[],
    readonly _id?: string,
  ) {}
}
