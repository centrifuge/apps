import { DOCUMENT_ACCESS } from './document';

export class Collaborator {
  address: string;
  name: string;
  access: DOCUMENT_ACCESS;
}

export const collaboratorsToAccessList = (collaborators: Collaborator[], access: string) => {
  return collaborators.filter(
    c => c.access === access,
  ).map(c => c.address);
};
