import { ROLE } from '../constants';

export interface IUser {
  username: string;
  password?: string;
  _id?: string;
  account?: string;
  permissions: ROLE[];
  enabled: boolean;
  invited: boolean;
}

export class User implements IUser{
  username: string;
  password?: string = "";
  _id?: string;
  account?: string;
  permissions: ROLE[] = [];
  enabled: boolean = false;
  invited: boolean = false;
}
