import { DOCUMENT_ACCESS } from './document';
import { isValidAddress } from 'ethereumjs-util';

export class Collaborator {

  constructor(
    readonly address: string,
    readonly name: string,
    readonly access: DOCUMENT_ACCESS,
    readonly type?: CollaboratorTypes,
  ) {
    Collaborator.validate(this);
  }

  /**
   * Validates a collaborator
   * @param collaborator Collaborator
   */
  public static validate(collaborator: Collaborator) {
    //Make sure address is a valid string representing an eth address
    if (!isValidAddress(collaborator.address || '')) {
      throw new Error(CollaboratorErrors.ADDRESS_FORMAT);
    }
  }
}

export enum CollaboratorTypes {
  AUDITOR = 'auditor',
  ORACLE_SERVICE_PROVIDER = 'oracle_service_provider',
  VALUATION_FIRM = 'valuation_firm',
}

export enum CollaboratorErrors {
  ADDRESS_FORMAT = 'Collaborator address property must be a valid eth address',
}

export const collaboratorsToAccessList = (collaborators: Collaborator[], access: string) => {
  return collaborators.filter(
    c => c.access === access,
  ).map(c => c.address);
};
