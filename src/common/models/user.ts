import { ROLE } from '../constants';

export interface IUser {
  username: string;
  password: string;
  _id?: string;
  account?: string;
  permissions: ROLE[];
  enabled: boolean;
  invited: boolean;
}

export class User {
  username: string;
  password: string;
  _id?: string;
  account?: string;
  permissions: ROLE[] = [];
  enabled: boolean = false;
  invited: boolean = false;
}
