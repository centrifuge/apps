export class Contact {
  constructor(
    readonly name: string,
    readonly address: string,
    readonly ownerId?: string,
    readonly _id?: string,
  ) {}
}
